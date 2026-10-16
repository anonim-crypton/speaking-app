const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const store = require("../utils/store");

const COMPLAINTS_FILE = path.join(__dirname, "../data/complaints.json");

function saveComplaint(record) {
  try {
    let list = [];
    if (fs.existsSync(COMPLAINTS_FILE)) {
      list = JSON.parse(fs.readFileSync(COMPLAINTS_FILE, "utf-8") || "[]");
    }
    list.unshift(record);
    fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(list.slice(0, 500), null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to save complaint:", e);
  }
}

const router = express.Router();

const SUPPORTED_LANGUAGES = new Set(["uz", "en", "ru", "tr", "ko"]);
const MAX_WAIT_MS = 120 * 1000; 
const STALE_HEARTBEAT_MS = 18 * 1000; 


const LANGUAGE_POOLS = {
  uz: new Map(),
  en: new Map(),
  ru: new Map(),
  tr: new Map(),
  ko: new Map(),
};


const activeRooms = new Map();

const keyToRoomId = new Map();

function makeKey(clientId, userId) {
  if (userId && clientId) return `${userId}:${clientId}`;
  return userId ? `u:${userId}` : `c:${clientId}`;
}

function resolveUserInfo({ userId, clientId, name, username, avatarUrl }) {
  const dbUser = userId ? store.findById(userId) : null;
  const resolvedName =
    (name && String(name).trim()) ||
    dbUser?.name ||
    (dbUser?.email ? dbUser.email.split("@")[0] : null) ||
    "Foydalanuvchi";
  const resolvedUsername =
    (username && String(username).trim().replace(/^@+/, "")) ||
    dbUser?.username ||
    (dbUser?.email ? dbUser.email.split("@")[0].toLowerCase() : null) ||
    "speaker";

  return {
    userId: userId || null,
    clientId: clientId || null,
    name: resolvedName,
    username: resolvedUsername,
    avatarUrl: avatarUrl || dbUser?.avatarUrl || null,
  };
}

function broadcastToRoom(room, payload, excludeKey = null) {
  if (!room || !room.sseClients) return;
  const serialized = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of room.sseClients) {
    if (excludeKey && client.key === excludeKey) continue;
    try {
      client.res.write(serialized);
    } catch {
      
    }
  }
}

function destroyRoom(roomId, reason = "ended") {
  const room = activeRooms.get(roomId);
  if (!room) return;

  broadcastToRoom(room, { type: "room_closed", roomId, reason });

  if (room.sseClients) {
    for (const client of room.sseClients) {
      try {
        client.res.end();
      } catch {
        
      }
    }
    room.sseClients.clear();
  }

  for (const participantKey of room.participants.keys()) {
    keyToRoomId.delete(participantKey);
  }

  room.messages.length = 0;
  room.signals.length = 0;
  room.participants.clear();
  activeRooms.delete(roomId);
}

function removeFromAllQueues(key) {
  for (const pool of Object.values(LANGUAGE_POOLS)) {
    pool.delete(key);
  }
}

function cleanupParticipant(key) {
  removeFromAllQueues(key);
  const roomId = keyToRoomId.get(key);
  if (roomId) {
    destroyRoom(roomId, "partner_left");
  }
}

function purgeStaleEntries() {
  const now = Date.now();
  for (const pool of Object.values(LANGUAGE_POOLS)) {
    for (const [key, entry] of pool.entries()) {
      if (
        now - entry.joinedAt >= MAX_WAIT_MS ||
        now - entry.lastSeen >= STALE_HEARTBEAT_MS
      ) {
        pool.delete(key);
      }
    }
  }

  for (const [roomId, room] of activeRooms.entries()) {
    for (const p of room.participants.values()) {
      if (now - p.lastSeen >= STALE_HEARTBEAT_MS * 2) {
        destroyRoom(roomId, "timeout");
        break;
      }
    }
  }
}

function getPartnerForKey(room, key) {
  for (const [pKey, p] of room.participants.entries()) {
    if (pKey !== key) return p;
  }
  return null;
}

function tryMatchInPool(language, key) {
  const pool = LANGUAGE_POOLS[language];
  if (!pool) return null;
  const selfEntry = pool.get(key);
  if (!selfEntry) return null;

  for (const [candidateKey, candidate] of pool.entries()) {
    if (candidateKey === key) continue;
    if (
      selfEntry.userId &&
      candidate.userId &&
      selfEntry.userId === candidate.userId &&
      selfEntry.clientId === candidate.clientId
    ) {
      continue;
    }

    pool.delete(key);
    pool.delete(candidateKey);

    const roomId = `room_${language}_${crypto.randomUUID().slice(0, 8)}`;
    const now = Date.now();

    const p1 = {
      key: candidateKey,
      id: candidate.userId || candidate.clientId,
      userId: candidate.userId,
      clientId: candidate.clientId,
      name: candidate.name,
      username: candidate.username,
      avatarUrl: candidate.avatarUrl,
      language,
      speaking: false,
      muted: false,
      lastSeen: now,
      role: "caller", 
    };

    const p2 = {
      key,
      id: selfEntry.userId || selfEntry.clientId,
      userId: selfEntry.userId,
      clientId: selfEntry.clientId,
      name: selfEntry.name,
      username: selfEntry.username,
      avatarUrl: selfEntry.avatarUrl,
      language,
      speaking: false,
      muted: false,
      lastSeen: now,
      role: "callee",
    };

    const participants = new Map();
    participants.set(candidateKey, p1);
    participants.set(key, p2);

    const room = {
      roomId,
      language,
      createdAt: now,
      participants,
      messages: [],
      signals: [],
      sseClients: new Set(),
    };

    activeRooms.set(roomId, room);
    keyToRoomId.set(candidateKey, roomId);
    keyToRoomId.set(key, roomId);

    return room;
  }

  return null;
}

const sweepTimer = setInterval(purgeStaleEntries, 4000);
if (typeof sweepTimer.unref === "function") {
  sweepTimer.unref();
}


router.post("/join", (req, res) => {
  purgeStaleEntries();
  const { clientId, userId, language, name, username, avatarUrl } = req.body || {};
  const lang = String(language || "").trim().toLowerCase();

  if (!SUPPORTED_LANGUAGES.has(lang)) {
    return res.status(400).json({
      success: false,
      message: "Unsupported language pool",
    });
  }

  if (!clientId && !userId) {
    return res.status(400).json({
      success: false,
      message: "clientId or userId is required",
    });
  }

  const key = makeKey(clientId, userId);

  cleanupParticipant(key);

  const info = resolveUserInfo({ userId, clientId, name, username, avatarUrl });
  const now = Date.now();

  const pool = LANGUAGE_POOLS[lang];
  pool.set(key, {
    key,
    ...info,
    language: lang,
    joinedAt: now,
    lastSeen: now,
  });

  const room = tryMatchInPool(lang, key);
  if (room) {
    const selfP = room.participants.get(key);
    const partnerP = getPartnerForKey(room, key);
    return res.json({
      success: true,
      status: "matched",
      language: lang,
      roomId: room.roomId,
      role: selfP?.role || "callee",
      partner: partnerP
        ? {
            id: partnerP.id,
            name: partnerP.name,
            username: partnerP.username,
            avatarUrl: partnerP.avatarUrl,
            language: partnerP.language,
            speaking: partnerP.speaking,
            muted: partnerP.muted,
          }
        : null,
    });
  }

  return res.json({
    success: true,
    status: "searching",
    language: lang,
    waitingInLanguagePool: pool.size,
  });
});


router.post("/status", (req, res) => {
  purgeStaleEntries();
  const { clientId, userId, language, sinceMessageCount = 0, sinceSignalIndex = 0 } =
    req.body || {};
  if (!clientId && !userId) {
    return res.status(400).json({ success: false, status: "idle" });
  }

  const key = makeKey(clientId, userId);
  const now = Date.now();

  const roomId = keyToRoomId.get(key);
  if (roomId) {
    const room = activeRooms.get(roomId);
    if (!room) {
      keyToRoomId.delete(key);
      return res.json({ success: true, status: "idle" });
    }
    const selfP = room.participants.get(key);
    if (selfP) selfP.lastSeen = now;
    const partnerP = getPartnerForKey(room, key);

    const pendingSignals = room.signals
      .slice(Number(sinceSignalIndex) || 0)
      .filter((s) => s.fromKey !== key);

    return res.json({
      success: true,
      status: "matched",
      language: room.language,
      roomId: room.roomId,
      role: selfP?.role || "callee",
      partner: partnerP
        ? {
            id: partnerP.id,
            name: partnerP.name,
            username: partnerP.username,
            avatarUrl: partnerP.avatarUrl,
            language: partnerP.language,
            speaking: Boolean(partnerP.speaking),
            muted: Boolean(partnerP.muted),
          }
        : null,
      messages: room.messages,
      newMessages: room.messages.slice(Number(sinceMessageCount) || 0),
      signals: pendingSignals,
      nextSignalIndex: room.signals.length,
    });
  }

  const lang = String(language || "").trim().toLowerCase();
  const pool = LANGUAGE_POOLS[lang];
  if (!pool || !pool.has(key)) {
    return res.json({
      success: true,
      status: "idle",
    });
  }

  const entry = pool.get(key);
  if (now - entry.joinedAt >= MAX_WAIT_MS) {
    pool.delete(key);
    return res.json({
      success: true,
      status: "timeout",
    });
  }

  entry.lastSeen = now;

  const room = tryMatchInPool(lang, key);
  if (room) {
    const selfP = room.participants.get(key);
    const partnerP = getPartnerForKey(room, key);
    return res.json({
      success: true,
      status: "matched",
      language: lang,
      roomId: room.roomId,
      role: selfP?.role || "callee",
      partner: partnerP
        ? {
            id: partnerP.id,
            name: partnerP.name,
            username: partnerP.username,
            avatarUrl: partnerP.avatarUrl,
            language: partnerP.language,
            speaking: partnerP.speaking,
            muted: partnerP.muted,
          }
        : null,
      messages: room.messages,
      signals: [],
      nextSignalIndex: 0,
    });
  }

  return res.json({
    success: true,
    status: "searching",
    language: lang,
    elapsedSeconds: Math.floor((now - entry.joinedAt) / 1000),
    waitingInLanguagePool: pool.size,
  });
});


router.get("/room-stream", (req, res) => {
  const { roomId, clientId, userId } = req.query;
  const room = activeRooms.get(String(roomId || ""));
  if (!room) {
    return res.status(404).json({ success: false, message: "Room not found" });
  }

  const key = makeKey(clientId, userId);
  const selfP = room.participants.get(key);
  if (selfP) selfP.lastSeen = Date.now();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const clientEntry = { key, res };
  room.sseClients.add(clientEntry);

  const partnerP = getPartnerForKey(room, key);
  res.write(
    `data: ${JSON.stringify({
      type: "init",
      roomId: room.roomId,
      messages: room.messages,
      partner: partnerP
        ? {
            id: partnerP.id,
            name: partnerP.name,
            username: partnerP.username,
            speaking: Boolean(partnerP.speaking),
            muted: Boolean(partnerP.muted),
          }
        : null,
    })}\n\n`
  );

  const keepAlive = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(keepAlive);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(keepAlive);
    room.sseClients.delete(clientEntry);
  });
});


router.post("/message", (req, res) => {
  const { roomId, clientId, userId, text } = req.body || {};
  const cleanText = String(text || "").trim();
  if (!cleanText) {
    return res.status(400).json({ success: false, message: "Empty message" });
  }

  const key = makeKey(clientId, userId);
  const resolvedRoomId = roomId || keyToRoomId.get(key);
  const room = activeRooms.get(String(resolvedRoomId || ""));
  if (!room || !room.participants.has(key)) {
    return res.status(404).json({ success: false, message: "Active room not found" });
  }

  const sender = room.participants.get(key);
  sender.lastSeen = Date.now();

  const msg = {
    id: crypto.randomUUID(),
    senderKey: key,
    senderId: sender.id,
    senderName: sender.name,
    senderUsername: sender.username,
    text: cleanText.slice(0, 1000),
    createdAt: new Date().toISOString(),
  };

  room.messages.push(msg);

  broadcastToRoom(room, {
    type: "chat_message",
    message: msg,
  });

  return res.json({
    success: true,
    message: msg,
  });
});


router.post("/speaking", (req, res) => {
  const { roomId, clientId, userId, speaking, muted } = req.body || {};
  const key = makeKey(clientId, userId);
  const resolvedRoomId = roomId || keyToRoomId.get(key);
  const room = activeRooms.get(String(resolvedRoomId || ""));
  if (!room || !room.participants.has(key)) {
    return res.json({ success: false });
  }

  const participant = room.participants.get(key);
  participant.lastSeen = Date.now();
  participant.speaking = Boolean(speaking) && !muted;
  participant.muted = Boolean(muted);

  broadcastToRoom(
    room,
    {
      type: "partner_speaking",
      speaking: participant.speaking,
      muted: participant.muted,
    },
    key
  );

  return res.json({ success: true });
});


router.post("/signal", (req, res) => {
  const { roomId, clientId, userId, type, payload } = req.body || {};
  const key = makeKey(clientId, userId);
  const resolvedRoomId = roomId || keyToRoomId.get(key);
  const room = activeRooms.get(String(resolvedRoomId || ""));
  if (!room || !room.participants.has(key)) {
    return res.status(404).json({ success: false });
  }

  const participant = room.participants.get(key);
  participant.lastSeen = Date.now();

  const sigType = String(req.body?.type || req.body?.signal?.type || "");
  const sigPayload =
    req.body?.payload !== undefined ? req.body.payload : req.body?.signal?.payload;

  const signalObj = {
    id: crypto.randomUUID(),
    fromKey: key,
    type: sigType,
    payload: sigPayload,
    createdAt: Date.now(),
  };

  room.signals.push(signalObj);
  if (room.signals.length > 100) {
    room.signals.splice(0, room.signals.length - 100);
  }

  broadcastToRoom(
    room,
    {
      type: "webrtc_signal",
      signal: signalObj,
    },
    key
  );

  return res.json({ success: true });
});

/**
 * POST /api/matchmaking/complaint
 * Submits a complaint against the current partner during the meeting.
 */
router.post("/complaint", (req, res) => {
  const { reasons, details, partnerUsername } = req.body || {};
  if ((!Array.isArray(reasons) || reasons.length === 0) && !String(details || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "Shikoyat sababini tanlang yoki batafsil yozing",
    });
  }
  saveComplaint({
    id: "comp_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
    partnerUsername: partnerUsername || "unknown",
    reporterUserId: req.body?.userId || null,
    reasons: reasons || [],
    details: String(details || "").trim(),
    createdAt: new Date().toISOString(),
    status: "pending",
  });

  return res.json({
    success: true,
    message: "Shikoyatingiz qabul qilindi",
  });
});


router.post("/leave", (req, res) => {
  const { clientId, userId } = req.body || {};
  if (clientId || userId) {
    const key = makeKey(clientId, userId);
    cleanupParticipant(key);
  }
  return res.json({
    success: true,
    status: "idle",
  });
});

module.exports = router;
