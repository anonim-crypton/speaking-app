const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), "utf8");
}

function readSessions() {
  try {
    const raw = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write sessions:", err);
  }
}

function parseDeviceName(userAgent = "") {
  const ua = String(userAgent || "");
  let os = "Noma'lum OS";
  let browser = "Brauzer";

  if (/windows phone/i.test(ua)) os = "Windows Phone";
  else if (/win64|wow64|windows nt 10/i.test(ua)) os = "Windows 10/11";
  else if (/windows nt 6\.3/i.test(ua)) os = "Windows 8.1";
  else if (/windows nt 6\.1/i.test(ua)) os = "Windows 7";
  else if (/windows/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) {
    const match = ua.match(/Android\s([0-9\.]+)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = /ipad/i.test(ua) ? "iPad (iOS)" : "iPhone (iOS)";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  if (/edg/i.test(ua)) browser = "Microsoft Edge";
  else if (/opr|opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/msie|trident/i.test(ua)) browser = "Internet Explorer";

  return `${os} (${browser})`;
}

function getFingerprint(userAgent = "", ip = "") {
  return crypto
    .createHash("sha256")
    .update(`${userAgent.slice(0, 100)}_${ip}`)
    .digest("hex")
    .slice(0, 24);
}

function cleanIp(ip = "") {
  if (!ip) return "127.0.0.1";
  let s = String(ip).trim();
  if (s.startsWith("::ffff:")) s = s.slice(7);
  if (s === "::1") s = "127.0.0.1";
  return s;
}

function createSession({ userId, ip, userAgent }) {
  const sessions = readSessions();
  const cIp = cleanIp(ip);
  const fp = getFingerprint(userAgent, cIp);

  // Check if this fingerprint is blocked for this user
  const blockedRecord = sessions.find(
    (s) => s.userId === userId && s.deviceFingerprint === fp && s.blocked
  );
  if (blockedRecord) {
    return { error: "DEVICE_BLOCKED" };
  }

  const sid = "sess_" + crypto.randomUUID();
  const now = new Date().toISOString();

  const newSession = {
    id: sid,
    userId,
    deviceName: parseDeviceName(userAgent),
    ip: cIp,
    userAgent: String(userAgent || "").slice(0, 255),
    deviceFingerprint: fp,
    createdAt: now,
    lastActive: now,
    blocked: false,
    revoked: false,
  };

  sessions.unshift(newSession);
  // Keep up to 100 sessions per user
  const userSessions = sessions.filter((s) => s.userId === userId);
  if (userSessions.length > 50) {
    const toRemove = userSessions.slice(50).map((s) => s.id);
    const filtered = sessions.filter((s) => !toRemove.includes(s.id));
    writeSessions(filtered);
  } else {
    writeSessions(sessions);
  }

  return { session: newSession };
}

function getSession(sid) {
  if (!sid) return null;
  const sessions = readSessions();
  return sessions.find((s) => s.id === sid) || null;
}

function touchSession(sid, ip) {
  if (!sid) return;
  const sessions = readSessions();
  const session = sessions.find((s) => s.id === sid);
  if (session && !session.revoked) {
    session.lastActive = new Date().toISOString();
    if (ip) session.ip = cleanIp(ip);
    writeSessions(sessions);
  }
}

function getUserSessions(userId, currentSid = "") {
  const sessions = readSessions();
  return sessions
    .filter((s) => s.userId === userId && !s.revoked)
    .map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      ip: s.ip,
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: s.id === currentSid,
      blocked: Boolean(s.blocked),
    }));
}

function revokeSession(userId, sessionId) {
  const sessions = readSessions();
  const session = sessions.find((s) => s.userId === userId && s.id === sessionId);
  if (!session) return false;
  session.revoked = true;
  writeSessions(sessions);
  return true;
}

function blockSession(userId, sessionId) {
  const sessions = readSessions();
  const session = sessions.find((s) => s.userId === userId && s.id === sessionId);
  if (!session) return false;
  session.blocked = true;
  session.revoked = true; // Auto-terminate current session
  writeSessions(sessions);
  return true;
}

function unblockSession(userId, sessionId) {
  const sessions = readSessions();
  const session = sessions.find((s) => s.userId === userId && s.id === sessionId);
  if (!session) return false;
  session.blocked = false;
  session.revoked = false;
  writeSessions(sessions);
  return true;
}

module.exports = {
  createSession,
  getSession,
  touchSession,
  getUserSessions,
  revokeSession,
  blockSession,
  unblockSession,
  cleanIp,
  getFingerprint,
};
