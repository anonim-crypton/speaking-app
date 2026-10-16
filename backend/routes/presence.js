const express = require("express");

const router = express.Router();

/**
 * Real-time Online Presence Tracker
 * Tracks both live SSE streams and heartbeat timestamps per unique visitor/user.
 */
const HEARTBEAT_TTL_MS = 30_000;
const DISCONNECT_GRACE_MS = 2_000;

// Map<actorKey, { lastSeen: number, connections: Set<res>, disconnectTimer: NodeJS.Timeout | null }>
const actors = new Map();
// All connected SSE response streams
const sseClients = new Set();

function getActorKey(req) {
  const userId = (req.query.userId || req.body?.userId || "").toString().trim();
  const clientId = (req.query.clientId || req.body?.clientId || "").toString().trim();
  if (userId) return `u:${userId}`;
  if (clientId) return `c:${clientId}`;
  return `ip:${req.ip || "unknown"}`;
}

function computeOnlineCount() {
  const now = Date.now();
  let count = 0;

  for (const [key, entry] of actors.entries()) {
    const hasLiveSocket = entry.connections.size > 0;
    const hasFreshHeartbeat = now - entry.lastSeen <= HEARTBEAT_TTL_MS;

    if (hasLiveSocket || hasFreshHeartbeat) {
      count += 1;
    } else if (!entry.disconnectTimer) {
      actors.delete(key);
    }
  }

  return count;
}

function broadcastCount() {
  const onlineCount = computeOnlineCount();
  const payload = `data: ${JSON.stringify({ onlineCount, timestamp: Date.now() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Periodic broadcast and cleanup every 1 second
setInterval(() => {
  broadcastCount();
}, 1_000).unref();

/**
 * GET /api/presence
 * Returns the current online user count.
 */
router.get("/", (req, res) => {
  const key = getActorKey(req);
  let entry = actors.get(key);
  if (!entry) {
    entry = { lastSeen: Date.now(), connections: new Set(), disconnectTimer: null };
    actors.set(key, entry);
  } else {
    entry.lastSeen = Date.now();
  }

  return res.json({
    success: true,
    onlineCount: computeOnlineCount(),
  });
});

/**
 * POST /api/presence/heartbeat
 * Updates lastSeen timestamp for the current user/client.
 */
router.post("/heartbeat", (req, res) => {
  const key = getActorKey(req);
  let entry = actors.get(key);
  const isNew = !entry;

  if (!entry) {
    entry = { lastSeen: Date.now(), connections: new Set(), disconnectTimer: null };
    actors.set(key, entry);
  } else {
    entry.lastSeen = Date.now();
    if (entry.disconnectTimer) {
      clearTimeout(entry.disconnectTimer);
      entry.disconnectTimer = null;
    }
  }

  if (isNew) {
    broadcastCount();
  }

  return res.json({
    success: true,
    onlineCount: computeOnlineCount(),
  });
});

/**
 * POST /api/presence/leave
 * Called via navigator.sendBeacon on tab/window unload.
 */
router.post("/leave", (req, res) => {
  const key = getActorKey(req);
  const entry = actors.get(key);
  if (entry && entry.connections.size === 0) {
    actors.delete(key);
    broadcastCount();
  }
  return res.json({ success: true });
});

/**
 * GET /api/presence/stream
 * Server-Sent Events (SSE) stream for instant online user count updates.
 */
router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const key = getActorKey(req);
  let entry = actors.get(key);
  if (!entry) {
    entry = { lastSeen: Date.now(), connections: new Set(), disconnectTimer: null };
    actors.set(key, entry);
  } else {
    entry.lastSeen = Date.now();
    if (entry.disconnectTimer) {
      clearTimeout(entry.disconnectTimer);
      entry.disconnectTimer = null;
    }
  }

  entry.connections.add(res);
  sseClients.add(res);

  // Immediately broadcast updated count to everyone (including this new client)
  broadcastCount();

  // Keep-alive comment every 20s
  const keepAlive = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(keepAlive);
    }
  }, 20_000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(res);

    const current = actors.get(key);
    if (current) {
      current.connections.delete(res);
      if (current.connections.size === 0) {
        // Short grace period so page reloads don't flicker 1 -> 0 -> 1
        current.disconnectTimer = setTimeout(() => {
          const check = actors.get(key);
          if (check && check.connections.size === 0) {
            actors.delete(key);
            broadcastCount();
          }
        }, DISCONNECT_GRACE_MS);
      }
    }
  });
});

module.exports = router;
