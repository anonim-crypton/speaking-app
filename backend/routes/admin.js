const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const supabase = require("../lib/supabase");

const router = express.Router();

const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const COMPLAINTS_FILE = path.join(DATA_DIR, "complaints.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");
const ANNOUNCEMENTS_FILE = path.join(DATA_DIR, "announcements.json");
const AUDIT_LOGS_FILE = path.join(DATA_DIR, "audit_logs.json");
const SECURITY_ALERTS_FILE = path.join(DATA_DIR, "security_alerts.json");
const BOOKS_CONFIG_FILE = path.join(DATA_DIR, "books_config.json");
const store = require("../utils/store");

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  defaultSignupDiamonds: 50,
  matchCostDiamonds: 0,
  dailyRewardDiamonds: 5,
  allowGuestMatch: true,
  chatMessageFilter: true,
  platformNotice: "Lingo Speek platformasi barqaror ishlamoqda.",
  adminTrustedIps: ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"],
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || "dasturchi@gmail.com",
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

for (const [filePath, defVal] of [
  [USERS_FILE, []],
  [SESSIONS_FILE, []],
  [COMPLAINTS_FILE, []],
  [ANNOUNCEMENTS_FILE, []],
  [AUDIT_LOGS_FILE, []],
  [SECURITY_ALERTS_FILE, []],
  [BOOKS_CONFIG_FILE, { isPremiumRequired: true }],
  [SETTINGS_FILE, DEFAULT_SETTINGS],
]) {
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(defVal, null, 2), "utf8");
    } catch {
      /* ignore */
    }
  }
}

function readJson(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error(`Failed to write ${filePath}:`, e.message);
    return false;
  }
}

function readBooksConfig() {
  const cfg = readJson(BOOKS_CONFIG_FILE, { isPremiumRequired: true });
  return {
    isPremiumRequired: cfg.isPremiumRequired !== false,
  };
}

function writeBooksConfig(cfg) {
  writeJson(BOOKS_CONFIG_FILE, cfg);
}

function logAdminAction(action, details, targetId = null) {
  const logs = readJson(AUDIT_LOGS_FILE, []);
  logs.unshift({
    id: "log_" + crypto.randomBytes(5).toString("hex"),
    action,
    details,
    targetId,
    timestamp: new Date().toISOString(),
    admin: "Super Admin",
  });
  writeJson(AUDIT_LOGS_FILE, logs.slice(0, 200));
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const SECRET_SALT = "lingo-speek-supersecret-salt-2026";

function generateCsrfAndSignature(sub = "gate") {
  const ts = String(Math.floor(Date.now() / 1000));
  const csrfRaw = `${sub}:${ts}:${SECRET_SALT}`;
  const csrfToken = crypto.createHash("sha256").update(csrfRaw).digest("hex").slice(0, 32);
  const sigRaw = `${csrfToken}:${ts}:${SECRET_SALT}`;
  const urlSignature = crypto
    .createHmac("sha256", SECRET_SALT)
    .update(sigRaw)
    .digest("hex")
    .slice(0, 24);
  return {
    csrfToken,
    timestamp: ts,
    urlSignature,
    encryptedUrlParams: `csrf=${csrfToken}&sec_sign=${urlSignature}&t=${ts}`,
  };
}

/**
 * Syncs users and messages from Supabase into local users.json so deployed
 * environments (Render/Vercel) always have up-to-date user & message data.
 */
async function syncUsersFromSupabase() {
  const client = supabase.getSupabase();
  const localUsers = readJson(USERS_FILE, []);
  if (!client) return localUsers;

  try {
    const [{ data: profiles, error: pErr }, { data: allMessages }] = await Promise.all([
      client.from("profiles").select("*"),
      client.from("messages").select("*").order("created_at", { ascending: true }),
    ]);

    if (pErr) {
      console.warn("Failed to fetch Supabase profiles in admin:", pErr.message);
      return localUsers;
    }

    if (!Array.isArray(profiles)) {
      return localUsers;
    }

    const localMap = new Map();
    for (const u of localUsers) {
      if (u && u.id) localMap.set(String(u.id), { ...u });
    }

    // Supabase profiles is the master DB. Only keep users that currently exist in Supabase!
    const userMap = new Map();
    for (const p of profiles) {
      if (!p || !p.id) continue;
      const pid = String(p.id);
      const existing = localMap.get(pid) || {};
      const extractedUsername = supabase.extractProfileUsername(p) || existing.username || null;
      userMap.set(pid, {
        ...existing,
        id: p.id,
        name: p.name || existing.name || null,
        username: extractedUsername,
        avatarUrl: p.avatar_url || existing.avatarUrl || null,
        email: p.email || existing.email || null,
        phone: p.phone || existing.phone || null,
        provider: p.provider || existing.provider || "password",
        countryCode: p.country_code || existing.countryCode || null,
        age: p.age ?? existing.age ?? null,
        purpose: p.purpose ?? existing.purpose ?? null,
        gender: p.gender ?? existing.gender ?? null,
        diamonds: typeof p.diamonds === "number" ? p.diamonds : Number(existing.diamonds || 0),
        isPremium: Boolean(p.is_premium ?? existing.isPremium ?? false),
        isVerified: Boolean(p.is_verified ?? existing.isVerified ?? false),
        isBanned: Boolean(p.is_banned ?? existing.isBanned ?? false),
        onboardingCompleted: Boolean(p.onboarding_completed ?? existing.onboardingCompleted ?? false),
        createdAt: p.created_at || existing.createdAt || new Date().toISOString(),
      });
    }

    if (Array.isArray(allMessages)) {
      for (const rm of allMessages) {
        if (!rm || !rm.user_id) continue;
        const target = userMap.get(String(rm.user_id));
        if (!target) continue;
        const msgs = Array.isArray(target.adminMessages) ? [...target.adminMessages] : [];
        const exists = msgs.some(
          (m) => String(m.id) === String(rm.id) || (m.text === rm.text && m.createdAt === rm.created_at)
        );
        if (!exists) {
          msgs.push({
            id: String(rm.id),
            text: rm.text,
            isAdmin: Boolean(rm.is_admin),
            is_admin: Boolean(rm.is_admin),
            sender: rm.is_admin ? "Admin" : rm.name || target.name || "Foydalanuvchi",
            createdAt: rm.created_at,
            sentAt: rm.created_at,
            read: true,
          });
        }
        target.adminMessages = msgs;
      }
    }

    const merged = Array.from(userMap.values());
    writeJson(USERS_FILE, merged);

    // Clean up sessions for deleted users
    const currentSessions = readJson(SESSIONS_FILE, []);
    const validUserIds = new Set(userMap.keys());
    const validSessions = currentSessions.filter((s) => !s.userId || validUserIds.has(String(s.userId)));
    if (validSessions.length !== currentSessions.length) {
      writeJson(SESSIONS_FILE, validSessions);
    }

    return merged;
  } catch (err) {
    console.error("syncUsersFromSupabase error:", err);
    return localUsers;
  }
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "127.0.0.1";
}

function isIpTrusted(ip, trustedList = []) {
  if (!ip) return false;
  const cleanIp = String(ip).replace(/^::ffff:/, "").trim();
  // Localhost addresses are always trusted
  if (cleanIp === "127.0.0.1" || cleanIp === "::1" || cleanIp === "localhost") {
    return true;
  }

  for (const trusted of trustedList) {
    if (!trusted) continue;
    const cleanTrusted = String(trusted).replace(/^::ffff:/, "").trim();
    if (cleanTrusted === cleanIp) return true;
    if (cleanTrusted.endsWith("*") && cleanIp.startsWith(cleanTrusted.slice(0, -1))) {
      return true;
    }
  }
  return false;
}

async function sendAdminSecurityAlert({ ip, userAgent, time, details }) {
  const settings = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  const targetEmail = settings.adminAlertEmail || process.env.ADMIN_ALERT_EMAIL || "dasturchi@gmail.com";
  const nowIso = time || new Date().toISOString();

  // 1. Record alert in security_alerts.json for Admin Dashboard UI
  const alerts = readJson(SECURITY_ALERTS_FILE, []);
  const alertItem = {
    id: "sec_" + crypto.randomBytes(5).toString("hex"),
    type: "UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT",
    ip,
    userAgent: userAgent || "Noma'lum qurilma",
    timestamp: nowIso,
    details: details || "Begona qurilma yoki ruxsat etilmagan IP manzil orqali kirish urinishi bloklandi.",
    read: false,
  };
  alerts.unshift(alertItem);
  writeJson(SECURITY_ALERTS_FILE, alerts.slice(0, 150));

  // 2. Record audit log
  logAdminAction(
    "security_intrusion_blocked",
    `Begona qurilmadan admin panelga kirish bloklandi. IP: ${ip}, Qurilma: ${userAgent || "Noma'lum"}`
  );

  // 3. Dispatch Email Alert
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Boolean(process.env.SMTP_SECURE === "true"),
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"Lingo Speek Xavfsizlik" <${process.env.SMTP_USER || "security@lingospeek.com"}>`,
      to: targetEmail,
      subject: "🚨 DIQQAT: Admin panelga begona qurilmadan kirishga urinish!",
      html: `
        <div style="font-family: Arial, sans-serif; background: #0b071b; color: #ffffff; padding: 25px; border-radius: 12px; max-width: 550px; border: 1px solid rgba(239,68,68,0.4);">
          <h2 style="color: #ef4444; margin-top: 0;">🚨 Xavfsizlik Ogohlantirishi</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Sizning <b>Lingo Speek Admin Panelingizga</b> begona va ruxsat berilmagan qurilmadan kirishga urinish qayd etildi va tizim tomonidan <b>bloklandi</b>!
          </p>
          <div style="background: rgba(255,255,255,0.06); padding: 15px; border-radius: 8px; margin: 18px 0; font-size: 13px; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0;"><b>🌐 IP Manzil:</b> <span style="color: #f87171; font-family: monospace;">${ip}</span></p>
            <p style="margin: 5px 0;"><b>📱 Qurilma / Brauzer:</b> <span style="color: #cbd5e1;">${userAgent || "Noma'lum"}</span></p>
            <p style="margin: 5px 0;"><b>⏰ Vaqt:</b> <span style="color: #93c5fd;">${new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" })}</span></p>
            <p style="margin: 5px 0;"><b>🛡️ Holati:</b> <span style="color: #34d399; font-weight: bold;">Bloklandi (Kirish rad etildi)</span></p>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">
            Agar bu siz bo'lmasangiz, darhol admin parolini tekshiring. Agar bu sizning yangi qurilmangiz bo'lsa, admin paneldan ushbu IP manzilni tasdiqlang.
          </p>
        </div>
      `,
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`[SECURITY] Alert email sent successfully to ${targetEmail} for IP ${ip}`);
    } else {
      console.log(`[SECURITY ALERT LOGGED]: Unauthorized admin access attempt from IP: ${ip}, Device: ${userAgent}`);
    }
  } catch (err) {
    console.error("[SECURITY] Email alert sending error:", err.message);
  }
}

// Active admin sessions with 1-hour expiration
const activeAdminSessions = new Map();
const ADMIN_SESSION_DURATION = 3600 * 1000; // 1 hour (3600 seconds)

function requireAdminAuth(req, res, next) {
  const clientIp = getClientIp(req);
  const settings = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  const trustedIps = settings.adminTrustedIps || ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];

  // 1. IP Whitelist check
  if (!isIpTrusted(clientIp, trustedIps)) {
    void sendAdminSecurityAlert({
      ip: clientIp,
      userAgent: req.headers["user-agent"] || "Noma'lum",
      time: new Date().toISOString(),
      details: `Ruxsatsiz IP orqali admin so'rovi: ${req.method} ${req.originalUrl}`,
    });
    return res.status(403).json({
      success: false,
      code: "IP_BLOCKED",
      message: "Begona qurilma yoki ruxsat etilmagan IP manzil orqali admin panelga kirish taqiqlangan! Xabarnoma admin emailiga yuborildi.",
    });
  }

  // 2. Token & 1-hour expiration check
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim() || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Admin autentifikatsiyasi talab etiladi",
    });
  }

  const session = activeAdminSessions.get(token);
  if (session) {
    if (Date.now() > session.expiresAt) {
      activeAdminSessions.delete(token);
      return res.status(401).json({
        success: false,
        code: "ADMIN_SESSION_EXPIRED",
        message: "Admin seansi 1 soatdan so'ng xavfsizlik maqsadida yakunlandi. Iltimos, qaytadan kiring.",
      });
    }
  }

  next();
}

// In-memory brute force protection tracking
const failedLoginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

function constantTimeCompare(a, b) {
  try {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) {
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Cached users to make /stats respond in 0ms without network lag
let lastUsersSyncTime = 0;
let cachedAdminUsers = null;

async function getAdminUsersCached(force = false) {
  const now = Date.now();
  if (!force && cachedAdminUsers && now - lastUsersSyncTime < 15000) {
    return cachedAdminUsers;
  }
  cachedAdminUsers = await syncUsersFromSupabase();
  lastUsersSyncTime = now;
  return cachedAdminUsers;
}

router.get(["/csrf", "/csrf/"], (req, res) => {
  const sub = req.query.scope || "guest";
  return res.json({
    success: true,
    ...generateCsrfAndSignature(sub),
  });
});

router.post(["/login", "/login/"], async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "").trim();
  const clientIp = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "Noma'lum qurilma";

  const settings = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  const trustedIps = settings.adminTrustedIps || ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];

  // 1. Check if login attempt is from trusted IP/computer
  if (!isIpTrusted(clientIp, trustedIps)) {
    await sendAdminSecurityAlert({
      ip: clientIp,
      userAgent,
      time: new Date().toISOString(),
      details: `Begona qurilmadan admin login urinishi: login "${username}"`,
    });
    return res.status(403).json({
      success: false,
      code: "IP_BLOCKED",
      message: "Faqat belgilangan kompyuterdan kirish mumkin! Begona qurilmadan kirishga urinish aniqlandi va xabarnoma admin emailiga yuborildi.",
    });
  }

  // 2. Brute-Force Rate Limiting & Lockout Check
  const attemptRecord = failedLoginAttempts.get(clientIp) || { count: 0, lockedUntil: 0 };
  const now = Date.now();

  if (attemptRecord.lockedUntil > now) {
    const remainingMins = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
    return res.status(429).json({
      success: false,
      code: "TOO_MANY_ATTEMPTS",
      message: `Xavfsizlik: Ko'p marta xato parol kiritildi! Hisob ${remainingMins} daqiqaga vaqtincha bloklandi.`,
    });
  }

  // 3. Verify admin credentials using constant-time comparison to prevent timing leaks
  const isUsernameMatch = constantTimeCompare(username, ADMIN_USERNAME);
  const isPasswordMatch = constantTimeCompare(password, ADMIN_PASSWORD);

  if (isUsernameMatch && isPasswordMatch) {
    // Reset failed login counter on success
    failedLoginAttempts.delete(clientIp);

    const sec = generateCsrfAndSignature("session");
    const sessionToken = `adm_${sec.csrfToken}`;
    const expiresAt = Date.now() + ADMIN_SESSION_DURATION;

    activeAdminSessions.set(sessionToken, {
      createdAt: Date.now(),
      expiresAt,
      ip: clientIp,
      userAgent,
    });

    logAdminAction("admin_login", `Admin tizimga kirdi (IP: ${clientIp})`);

    return res.json({
      success: true,
      token: sessionToken,
      expiresIn: 3600,
      expiresAt,
      clientIp,
      csrfToken: sec.csrfToken,
      urlSignature: sec.urlSignature,
      encryptedUrlHash: `token=${sessionToken.slice(0, 12)}...&sig=${sec.urlSignature}`,
      user: {
        username: ADMIN_USERNAME,
        role: "Super Admin",
      },
    });
  }

  // 4. Failed login: Increment attempts and apply security delay
  attemptRecord.count = (attemptRecord.count || 0) + 1;
  attemptRecord.lastAttempt = now;

  // Artificial delay against high-speed automated brute force dictionary attacks
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 300));

  if (attemptRecord.count >= MAX_LOGIN_ATTEMPTS) {
    attemptRecord.lockedUntil = now + LOCKOUT_DURATION_MS;
    failedLoginAttempts.set(clientIp, attemptRecord);

    await sendAdminSecurityAlert({
      ip: clientIp,
      userAgent,
      time: new Date().toISOString(),
      details: `🚨 BRUTE-FORCE HUJUMI: Admin loginiga ketma-ket ${attemptRecord.count} marta noto'g'ri parol kiritildi va 15 daqiqaga bloklandi.`,
    });

    return res.status(429).json({
      success: false,
      code: "TOO_MANY_ATTEMPTS",
      message: "Ketma-ket 5 marta xato parol kiritildi! Xavfsizlik choralari tufayli admin panel 15 daqiqaga bloklandi.",
    });
  }

  failedLoginAttempts.set(clientIp, attemptRecord);
  const triesLeft = MAX_LOGIN_ATTEMPTS - attemptRecord.count;

  return res.status(401).json({
    success: false,
    message: `Noto'g'ri login yoki parol! (Qolgan urinishlar: ${triesLeft} ta)`,
  });
});

// Protect all remaining admin endpoints with IP whitelist & 1-hour session expiration
router.use(requireAdminAuth);

router.get(["/stats", "/stats/"], async (req, res) => {
  const users = await getAdminUsersCached();
  const sessions = readJson(SESSIONS_FILE, []);
  const complaints = readJson(COMPLAINTS_FILE, []);
  const settingsData = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);

  const totalUsers = users.length;
  const totalDiamonds = users.reduce((sum, u) => sum + (Number(u?.diamonds) || 0), 0);
  const bannedUsers = users.filter((u) => u?.isBanned).length;
  const totalSessions = sessions.length;
  const blockedDevices = sessions.filter((s) => s?.blocked).length;
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter((c) => (c?.status || "pending") === "pending").length;

  const providers = {
    google: 0,
    password: 0,
    phone: 0,
  };
  for (const u of users) {
    const p = String(u?.provider || "").toLowerCase();
    if (p === "google" || u?.googleEmail) {
      providers.google += 1;
    } else if (p === "phone" || (u?.phone && !u?.email && !u?.passwordHash)) {
      providers.phone += 1;
    } else {
      providers.password += 1;
    }
  }

  // Generate 90-day device chart starting from 2026-10-18 (no dates prior to 2026-10-18)
  const START_DATE = new Date("2026-10-18T00:00:00Z");
  const chartDays = 90;
  const dateCounts = {};

  for (const s of sessions) {
    if (!s) continue;
    const isMobile =
      s.deviceType === "mobile" ||
      /android|iphone|ipad|ipod|mobile|phone|tablet/i.test(s.userAgent || "");
    const sDateStr = String(s.createdAt || "").slice(0, 10);
    const targetDate = sDateStr < "2026-10-18" ? "2026-10-18" : sDateStr;
    if (!dateCounts[targetDate]) {
      dateCounts[targetDate] = { desktop: 0, mobile: 0 };
    }
    if (isMobile) {
      dateCounts[targetDate].mobile += 1;
    } else {
      dateCounts[targetDate].desktop += 1;
    }
  }

  const deviceChart = [];
  for (let i = 0; i < chartDays; i++) {
    const d = new Date(START_DATE.getTime() + i * 24 * 60 * 60 * 1000);
    const dateKey = d.toISOString().slice(0, 10);
    const counts = dateCounts[dateKey] || { desktop: 0, mobile: 0 };
    deviceChart.push({
      date: dateKey,
      desktop: counts.desktop,
      mobile: counts.mobile,
    });
  }

  return res.json({
    success: true,
    stats: {
      totalUsers,
      bannedUsers,
      totalDiamonds,
      totalSessions,
      blockedDevices,
      totalComplaints,
      pendingComplaints,
      providers,
      deviceChart,
      maintenanceMode: Boolean(settingsData.maintenanceMode),
      securityAlertsCount: readJson(SECURITY_ALERTS_FILE, []).length,
      clientIp: getClientIp(req),
    },
  });
});

router.get(["/users", "/users/"], async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  let users = await syncUsersFromSupabase();

  if (q) {
    users = users.filter(
      (u) =>
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.username || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.phone || "").toLowerCase().includes(q) ||
        String(u.id || "").toLowerCase().includes(q)
    );
  }

  const sessions = readJson(SESSIONS_FILE, []);
  const usersWithDevices = users.map((u) => ({
    ...u,
    devices: sessions
      .filter((s) => s && String(s.userId) === String(u.id))
      .map((s) => ({
        id: s.id,
        userId: s.userId,
        deviceName: s.deviceName,
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        lastActive: s.lastActive,
        blocked: Boolean(s.blocked),
        revoked: Boolean(s.revoked),
      })),
  }));

  return res.json({
    success: true,
    users: usersWithDevices,
  });
});

router.post(["/users/:userId/action", "/users/:userId/action/"], async (req, res) => {
  const { userId } = req.params;
  const { action, amount, message } = req.body || {};
  let users = await syncUsersFromSupabase();
  const target = users.find((u) => u.id === userId);

  if (!target && action !== "delete") {
    return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
  }

  const nowIso = new Date().toISOString();

  if (action === "ban") {
    target.isBanned = true;
    target.bannedAt = nowIso;
    void supabase.updateRow("profiles", "id", userId, { is_banned: true });
    logAdminAction("user_banned", `Foydalanuvchi bloklandi: ${target.name || userId}`, userId);
  } else if (action === "unban") {
    target.isBanned = false;
    delete target.bannedAt;
    void supabase.updateRow("profiles", "id", userId, { is_banned: false });
    logAdminAction("user_unbanned", `Foydalanuvchi blokdan chiqarildi: ${target.name || userId}`, userId);
  } else if (action === "add_diamonds") {
    const amt = Number(amount || 0);
    if (amt <= 0) {
      return res.status(400).json({ success: false, message: "Musbat olmos miqdorini kiriting" });
    }
    target.diamonds = (Number(target.diamonds) || 0) + amt;
    target.diamondHistory = Array.isArray(target.diamondHistory) ? target.diamondHistory : [];
    target.diamondHistory.unshift({
      id: crypto.randomBytes(4).toString("hex"),
      amount: amt,
      type: "gift",
      createdAt: nowIso,
    });
    void supabase.updateRow("profiles", "id", userId, { diamonds: target.diamonds });
    logAdminAction("diamonds_gifted", `${amt} ta olmos hadya qilindi (Yangi balans: ${target.diamonds})`, userId);
  } else if (action === "revoke_diamonds") {
    const amt = Number(amount || 0);
    if (amt <= 0) {
      return res.status(400).json({ success: false, message: "Qaytarib olinadigan miqdorni kiriting" });
    }
    const current = Number(target.diamonds) || 0;
    const revokedAmt = Math.min(current, amt);
    target.diamonds = Math.max(0, current - revokedAmt);
    target.diamondHistory = Array.isArray(target.diamondHistory) ? target.diamondHistory : [];
    target.diamondHistory.unshift({
      id: crypto.randomBytes(4).toString("hex"),
      amount: -revokedAmt,
      type: "revoke",
      createdAt: nowIso,
    });
    void supabase.updateRow("profiles", "id", userId, { diamonds: target.diamonds });
    logAdminAction("diamonds_revoked", `${revokedAmt} ta olmos qaytarib olindi`, userId);
  } else if (action === "toggle_premium") {
    target.isPremium = !Boolean(target.isPremium);
    void supabase.updateRow("profiles", "id", userId, { is_premium: target.isPremium });
    store.updateUser(userId, { isPremium: target.isPremium });
    cachedAdminUsers = null;
    logAdminAction("premium_toggled", `Premium maqomi ${target.isPremium ? "yoqildi" : "bekor qilindi"}`, userId);
  } else if (action === "toggle_verified") {
    target.isVerified = !Boolean(target.isVerified);
    void supabase.updateRow("profiles", "id", userId, { is_verified: target.isVerified });
    logAdminAction("verification_toggled", `Tasdiqlanganlik holati: ${target.isVerified}`, userId);
  } else if (action === "send_message") {
    const msgText = String(message || "").trim();
    if (!msgText) {
      return res.status(400).json({ success: false, message: "Xabar matni bo'sh bo'lishi mumkin emas" });
    }
    target.adminMessages = Array.isArray(target.adminMessages) ? target.adminMessages : [];
    const newMsg = {
      id: "msg_" + crypto.randomBytes(4).toString("hex"),
      text: msgText,
      sentAt: nowIso,
      createdAt: nowIso,
      sender: "Admin",
      isAdmin: true,
      is_admin: true,
      read: false,
    };
    target.adminMessages.unshift(newMsg);
    void supabase.saveMessage({
      userId,
      name: "Admin",
      username: "admin",
      text: msgText,
      isAdmin: true,
    });
    logAdminAction("admin_message_sent", `Foydalanuvchiga xabar: ${msgText.slice(0, 40)}...`, userId);
  } else if (action === "delete") {
    void supabase.deleteProfile(userId);
    users = users.filter((u) => u.id !== userId);
    logAdminAction("user_deleted", `Foydalanuvchi o'chirildi: ${userId}`, userId);
  } else {
    return res.status(400).json({ success: false, message: `Noma'lum amal: ${action}` });
  }

  writeJson(USERS_FILE, users);
  return res.json({
    success: true,
    message: "Amal muvaffaqiyatli bajarildi",
    user: target,
  });
});

router.get(["/complaints", "/complaints/"], (req, res) => {
  const complaints = readJson(COMPLAINTS_FILE, []);
  complaints.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return res.json({ success: true, complaints });
});

router.post(["/complaints/:complaintId/action", "/complaints/:complaintId/action/"], (req, res) => {
  const { complaintId } = req.params;
  const { action } = req.body || {};
  const complaints = readJson(COMPLAINTS_FILE, []);
  const target = complaints.find((c) => c.id === complaintId);
  if (!target) {
    return res.status(404).json({ success: false, message: "Shikoyat topilmadi" });
  }
  target.status = ["resolved", "dismissed"].includes(action) ? action : "resolved";
  target.updatedAt = new Date().toISOString();
  writeJson(COMPLAINTS_FILE, complaints);
  logAdminAction("complaint_updated", `Shikoyat (${complaintId}) holati: ${target.status}`);
  return res.json({ success: true, message: "Shikoyat holati yangilandi" });
});

router.get(["/devices", "/devices/"], (req, res) => {
  const sessions = readJson(SESSIONS_FILE, []);
  sessions.sort((a, b) => String(b.lastActive || "").localeCompare(String(a.lastActive || "")));
  return res.json({ success: true, devices: sessions });
});

router.post(["/devices/:sessionId/action", "/devices/:sessionId/action/"], (req, res) => {
  const { sessionId } = req.params;
  const { action } = req.body || {};
  let sessions = readJson(SESSIONS_FILE, []);

  if (action === "revoke") {
    sessions = sessions.filter((s) => s.id !== sessionId);
    writeJson(SESSIONS_FILE, sessions);
    logAdminAction("device_session_revoked", `Seans o'chirildi: ${sessionId}`);
    return res.json({ success: true, message: "Seans o'chirildi" });
  }

  const target = sessions.find((s) => s.id === sessionId);
  if (!target) {
    return res.status(404).json({ success: false, message: "Qurilma seansi topilmadi" });
  }

  if (action === "block") {
    target.blocked = true;
    target.blockedAt = new Date().toISOString();
    logAdminAction("device_blocked", `Qurilma bloklandi: ${target.deviceName} (${target.ip})`);
  } else if (action === "unblock") {
    target.blocked = false;
    delete target.blockedAt;
    logAdminAction("device_unblocked", `Qurilma blokdan chiqarildi: ${target.deviceName} (${target.ip})`);
  } else {
    return res.status(400).json({ success: false, message: `Noma'lum amal: ${action}` });
  }

  writeJson(SESSIONS_FILE, sessions);
  return res.json({ success: true, message: "Qurilma holati yangilandi", device: target });
});

router.get(["/settings", "/settings/"], (req, res) => {
  const settingsData = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  return res.json({ success: true, settings: settingsData });
});

router.post(["/settings", "/settings/"], (req, res) => {
  const current = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  const patch = req.body || {};
  if (patch.defaultSignupDiamonds !== undefined) {
    patch.defaultSignupDiamonds = Math.max(0, parseInt(patch.defaultSignupDiamonds, 10) || 0);
  }
  if (patch.dailyRewardDiamonds !== undefined) {
    patch.dailyRewardDiamonds = Math.max(0, parseInt(patch.dailyRewardDiamonds, 10) || 0);
  }
  const nextSettings = { ...current, ...patch };
  writeJson(SETTINGS_FILE, nextSettings);
  logAdminAction("settings_updated", "Platforma asosiy sozlamalari yangilandi");
  return res.json({
    success: true,
    message: "Sozlamalar muvaffaqiyatli saqlandi",
    settings: nextSettings,
  });
});

router.get(["/announcements", "/announcements/"], (req, res) => {
  const items = readJson(ANNOUNCEMENTS_FILE, []);
  return res.json({ success: true, announcements: items });
});

router.post(["/announcements", "/announcements/"], (req, res) => {
  const title = String(req.body?.title || "").trim();
  const body = String(req.body?.body || "").trim();
  const priority = String(req.body?.priority || "info");

  if (!title || !body) {
    return res.status(400).json({ success: false, message: "Sarlavha va matn talab qilinadi" });
  }

  const items = readJson(ANNOUNCEMENTS_FILE, []);
  const newItem = {
    id: "ann_" + crypto.randomBytes(4).toString("hex"),
    title,
    body,
    priority,
    createdAt: new Date().toISOString(),
    active: true,
  };
  items.unshift(newItem);
  writeJson(ANNOUNCEMENTS_FILE, items);
  logAdminAction("broadcast_announcement", `E'lon tarqatildi: ${title}`);
  return res.json({
    success: true,
    message: "Bildirishnoma barcha foydalanuvchilarga yuborildi",
    announcement: newItem,
  });
});

router.delete(["/announcements/:id", "/announcements/:id/"], (req, res) => {
  const { id } = req.params;
  let items = readJson(ANNOUNCEMENTS_FILE, []);
  const target = items.find((a) => a.id === id);
  items = items.filter((a) => a.id !== id);
  writeJson(ANNOUNCEMENTS_FILE, items);
  logAdminAction("delete_announcement", `E'lon o'chirildi: ${target?.title || id}`);
  return res.json({
    success: true,
    message: "E'lon muvaffaqiyatli o'chirildi",
  });
});

router.get(["/logs", "/logs/"], (req, res) => {
  const logs = readJson(AUDIT_LOGS_FILE, []);
  return res.json({ success: true, logs });
});

router.get(["/security-alerts", "/security-alerts/"], (req, res) => {
  const alerts = readJson(SECURITY_ALERTS_FILE, []);
  return res.json({ success: true, alerts });
});

router.post(["/security-alerts/clear", "/security-alerts/clear/"], (req, res) => {
  writeJson(SECURITY_ALERTS_FILE, []);
  logAdminAction("security_alerts_cleared", "Xavfsizlik ogohlantirishlari ro'yxati tozalandi");
  return res.json({ success: true, message: "Barcha xavfsizlik ogohlantirishlari tozalandi" });
});

router.post(["/settings/add-current-ip", "/settings/add-current-ip/"], (req, res) => {
  const ip = getClientIp(req);
  const s = readJson(SETTINGS_FILE, DEFAULT_SETTINGS);
  if (!Array.isArray(s.adminTrustedIps)) {
    s.adminTrustedIps = ["127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost"];
  }
  if (!s.adminTrustedIps.includes(ip)) {
    s.adminTrustedIps.push(ip);
  }
  writeJson(SETTINGS_FILE, s);
  logAdminAction("trusted_ip_added", `Joriy IP manzil (${ip}) ishonchli ro'yxatga kiritildi`);
  return res.json({
    success: true,
    message: `IP ${ip} muvaffaqiyatli ishonchli kompyuterlar ro'yxatiga qo'shildi`,
    trustedIps: s.adminTrustedIps,
  });
});

router.get(["/books/config", "/books/config/"], (req, res) => {
  const cfg = readBooksConfig();
  return res.json({ success: true, config: cfg, isPremiumRequired: Boolean(cfg.isPremiumRequired) });
});

router.post(["/books/config", "/books/config/"], (req, res) => {
  const { isPremiumRequired } = req.body || {};
  const newCfg = {
    isPremiumRequired: Boolean(isPremiumRequired),
    updatedAt: new Date().toISOString(),
  };
  writeBooksConfig(newCfg);
  logAdminAction(
    "books_config_updated",
    `Kitoblar kirish tartibi o'zgartirildi: ${newCfg.isPremiumRequired ? "Faqat Premium (Yopiq)" : "Hamma uchun bepul (Ochiq)"}`
  );
  return res.json({
    success: true,
    config: newCfg,
    isPremiumRequired: newCfg.isPremiumRequired,
    message: newCfg.isPremiumRequired
      ? "Kitoblar faqat Premium foydalanuvchilar uchun sozlandi"
      : "Kitoblar barcha foydalanuvchilar uchun bepul va ochiq qilindi",
  });
});

module.exports = router;
