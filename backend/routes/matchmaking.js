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

const SUPPORTED_LANGUAGES = new Set(["uz", "en", "ru", "ar", "tr", "ko"]);
const CROSS_LANG_FALLBACK_MS = 60 * 1000; // 1 daqiqa (60s) kutish vaqti
const MAX_WAIT_MS = 180 * 1000;
const STALE_HEARTBEAT_MS = 18 * 1000;

const LANGUAGE_POOLS = {
  uz: new Map(),
  en: new Map(),
  ru: new Map(),
  ar: new Map(),
  tr: new Map(),
  ko: new Map(),
};

const FALLBACK_RANDOM_SPEAKERS = [
  { id: "spk_en_1", name: "Alex Carter", username: "alex_speaks", language: "en", isPremium: true, isVerified: true },
  { id: "spk_ru_1", name: "Dmitriy Volkov", username: "dmitriy_ru", language: "ru", isPremium: false, isVerified: false },
  { id: "spk_tr_1", name: "Emre Yılmaz", username: "emre_istanbul", language: "tr", isPremium: true, isVerified: true },
  { id: "spk_ar_1", name: "Omar Al-Farsi", username: "omar_arabic", language: "ar", isPremium: false, isVerified: false },
  { id: "spk_uz_1", name: "Sardorbek Karimov", username: "sardor_uz", language: "uz", isPremium: true, isVerified: true },
  { id: "spk_ko_1", name: "Min-jun Kim", username: "minjun_kr", language: "ko", isPremium: false, isVerified: false },
];

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
    isPremium: Boolean(dbUser?.isPremium),
    isVerified: Boolean(dbUser?.isVerified),
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

function recordTalkHistory(pA, pB, language, durationSec = 0) {
  try {
    const nowIso = new Date().toISOString();
    const pairs = [
      [pA, pB],
      [pB, pA],
    ];
    for (const [selfP, partnerP] of pairs) {
      if (!selfP?.userId) continue;
      const u = store.findById(selfP.userId);
      if (!u) continue;
      const partnerId = partnerP.userId || partnerP.clientId || partnerP.id;
      const history = Array.isArray(u.talkHistory) ? [...u.talkHistory] : [];
      const existingIdx = history.findIndex((h) => String(h.partnerId) === String(partnerId));
      const prevDuration = existingIdx >= 0 ? Number(history[existingIdx].durationSeconds || 0) : 0;
      const entry = {
        partnerId: String(partnerId),
        name: partnerP.name || "Foydalanuvchi",
        username: partnerP.username || "speaker",
        avatarUrl: partnerP.avatarUrl || null,
        isPremium: Boolean(partnerP.isPremium),
        isVerified: Boolean(partnerP.isVerified),
        language: partnerP.language || language || "en",
        durationSeconds: prevDuration + Math.max(0, Math.round(durationSec)),
        talkedAt: nowIso,
      };
      if (existingIdx >= 0) {
        history.splice(existingIdx, 1);
      }
      history.unshift(entry);
      const nextTalkSeconds = Number(u.talkSeconds || 0) + Math.max(0, Math.round(durationSec));
      store.updateUser(u.id, {
        talkHistory: history.slice(0, 100),
        talkSeconds: nextTalkSeconds,
      });
    }
  } catch (err) {
    console.warn("Failed to record talk history:", err);
  }
}

function destroyRoom(roomId, reason = "ended") {
  const room = activeRooms.get(roomId);
  if (!room) return;

  try {
    const parts = Array.from(room.participants.values());
    if (parts.length >= 2) {
      const durationSec = Math.max(1, Math.round((Date.now() - (room.createdAt || Date.now())) / 1000));
      recordTalkHistory(parts[0], parts[1], room.language, durationSec);
    }
  } catch (e) {
    console.warn("Room stats error:", e);
  }

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
      if (p.isVirtualFallback) continue;
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

function buildMatchedRoom(selfKey, selfEntry, candidateKey, candidate, roomLang) {
  const roomId = `room_${roomLang}_${crypto.randomUUID().slice(0, 8)}`;
  const now = Date.now();

  const p1 = {
    key: candidateKey,
    id: candidate.userId || candidate.clientId || candidate.id,
    userId: candidate.userId || null,
    clientId: candidate.clientId || null,
    name: candidate.name,
    username: candidate.username,
    avatarUrl: candidate.avatarUrl || null,
    isPremium: Boolean(candidate.isPremium),
    isVerified: Boolean(candidate.isVerified),
    language: candidate.language || roomLang,
    speaking: false,
    muted: false,
    lastSeen: now,
    isVirtualFallback: Boolean(candidate.isVirtualFallback),
    role: "caller",
  };

  const p2 = {
    key: selfKey,
    id: selfEntry.userId || selfEntry.clientId,
    userId: selfEntry.userId,
    clientId: selfEntry.clientId,
    name: selfEntry.name,
    username: selfEntry.username,
    avatarUrl: selfEntry.avatarUrl,
    isPremium: Boolean(selfEntry.isPremium),
    isVerified: Boolean(selfEntry.isVerified),
    language: selfEntry.language || roomLang,
    speaking: false,
    muted: false,
    lastSeen: now,
    role: "callee",
  };

  const participants = new Map();
  participants.set(candidateKey, p1);
  participants.set(selfKey, p2);

  const room = {
    roomId,
    language: p1.language || roomLang,
    createdAt: now,
    participants,
    messages: [],
    signals: [],
    sseClients: new Set(),
  };

  activeRooms.set(roomId, room);
  if (!candidate.isVirtualFallback) {
    keyToRoomId.set(candidateKey, roomId);
  }
  keyToRoomId.set(selfKey, roomId);

  recordTalkHistory(p1, p2, room.language, 0);
  return room;
}

function tryMatchInPool(language, key, allowCrossLanguage = false) {
  const pool = LANGUAGE_POOLS[language];
  if (!pool) return null;
  const selfEntry = pool.get(key);
  if (!selfEntry) return null;

  // 1. Try matching in the selected language pool first
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
    if (
      selfEntry.skipPartnerId &&
      String(candidate.userId || candidate.clientId) === String(selfEntry.skipPartnerId) &&
      pool.size > 2
    ) {
      continue;
    }

    pool.delete(key);
    pool.delete(candidateKey);
    return buildMatchedRoom(key, selfEntry, candidateKey, candidate, language);
  }

  // 2. Also check if any user in OTHER language pools has already waited >= 60s (or if allowCrossLanguage is true)
  const now = Date.now();
  const otherLangs = Object.keys(LANGUAGE_POOLS)
    .filter((l) => l !== language)
    .sort(() => Math.random() - 0.5);

  for (const otherLang of otherLangs) {
    const otherPool = LANGUAGE_POOLS[otherLang];
    if (!otherPool) continue;
    for (const [candidateKey, candidate] of otherPool.entries()) {
      if (candidateKey === key) continue;
      if (
        selfEntry.userId &&
        candidate.userId &&
        selfEntry.userId === candidate.userId &&
        selfEntry.clientId === candidate.clientId
      ) {
        continue;
      }
      const candidateWaited60s = now - (candidate.joinedAt || now) >= CROSS_LANG_FALLBACK_MS;
      if (allowCrossLanguage || candidateWaited60s) {
        pool.delete(key);
        otherPool.delete(candidateKey);
        return buildMatchedRoom(key, selfEntry, candidateKey, candidate, otherLang);
      }
    }
  }

  // 3. If 1 minute (60s) has elapsed and no live user was in any pool, assign a random speaker from another language
  if (allowCrossLanguage) {
    pool.delete(key);
    const otherLangPool = ["uz", "en", "ru", "tr", "ko"].filter((l) => l !== language);
    const randomLang =
      otherLangPool[Math.floor(Math.random() * otherLangPool.length)] || "en";

    const dbUsers = store
      .readUsers()
      .filter(
        (u) =>
          u &&
          !u.isBanned &&
          String(u.id) !== String(selfEntry.userId) &&
          String(u.id) !== String(selfEntry.skipPartnerId)
      );

    let chosenCandidate = null;
    if (dbUsers.length > 0) {
      const randUser = dbUsers[Math.floor(Math.random() * dbUsers.length)];
      chosenCandidate = {
        userId: randUser.id,
        id: randUser.id,
        name:
          randUser.name ||
          (randUser.email ? randUser.email.split("@")[0] : "Speaker"),
        username:
          randUser.username ||
          (randUser.email ? randUser.email.split("@")[0].toLowerCase() : "speaker"),
        avatarUrl: randUser.avatarUrl || randUser.onboarding?.avatarUrl || null,
        isPremium: Boolean(randUser.isPremium),
        isVerified: Boolean(randUser.isVerified || randUser.isPremium),
        language: randomLang,
        isVirtualFallback: true,
      };
    } else {
      const candidates = FALLBACK_RANDOM_SPEAKERS.filter(
        (s) => s.language !== language && s.id !== selfEntry.skipPartnerId
      );
      const pick =
        candidates[Math.floor(Math.random() * candidates.length)] ||
        FALLBACK_RANDOM_SPEAKERS[0];
      chosenCandidate = {
        ...pick,
        userId: null,
        isVirtualFallback: true,
      };
    }

    const vKey = `virtual_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return buildMatchedRoom(key, selfEntry, vKey, chosenCandidate, randomLang);
  }

  return null;
}

const sweepTimer = setInterval(purgeStaleEntries, 4000);
if (typeof sweepTimer.unref === "function") {
  sweepTimer.unref();
}


router.post("/join", (req, res) => {
  purgeStaleEntries();
  const {
    clientId,
    userId,
    language,
    name,
    username,
    avatarUrl,
    skipPartnerId,
    allowAnyLanguage,
  } = req.body || {};
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
    skipPartnerId: skipPartnerId || null,
    joinedAt: now,
    lastSeen: now,
  });

  const room = tryMatchInPool(lang, key, Boolean(allowAnyLanguage));
  if (room) {
    const selfP = room.participants.get(key);
    const partnerP = getPartnerForKey(room, key);
    return res.json({
      success: true,
      status: "matched",
      language: room.language || lang,
      roomId: room.roomId,
      role: selfP?.role || "callee",
      partner: partnerP
        ? {
            id: partnerP.id,
            name: partnerP.name,
            username: partnerP.username,
            avatarUrl: partnerP.avatarUrl,
            isPremium: Boolean(partnerP.isPremium),
            isVerified: Boolean(partnerP.isVerified),
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
  const {
    clientId,
    userId,
    language,
    allowAnyLanguage,
    sinceMessageCount = 0,
    sinceSignalIndex = 0,
  } = req.body || {};
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
    if (partnerP && partnerP.isVirtualFallback) {
      partnerP.lastSeen = now;
    }

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
            isPremium: Boolean(partnerP.isPremium),
            isVerified: Boolean(partnerP.isVerified),
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
  entry.lastSeen = now;

  const elapsedMs = now - entry.joinedAt;
  const shouldFallbackRandomLang =
    Boolean(allowAnyLanguage) || elapsedMs >= CROSS_LANG_FALLBACK_MS;

  const room = tryMatchInPool(lang, key, shouldFallbackRandomLang);
  if (room) {
    const selfP = room.participants.get(key);
    const partnerP = getPartnerForKey(room, key);
    return res.json({
      success: true,
      status: "matched",
      language: room.language || lang,
      roomId: room.roomId,
      role: selfP?.role || "callee",
      fallbackMatched: shouldFallbackRandomLang,
      partner: partnerP
        ? {
            id: partnerP.id,
            name: partnerP.name,
            username: partnerP.username,
            avatarUrl: partnerP.avatarUrl,
            isPremium: Boolean(partnerP.isPremium),
            isVerified: Boolean(partnerP.isVerified),
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
    elapsedSeconds: Math.floor(elapsedMs / 1000),
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
