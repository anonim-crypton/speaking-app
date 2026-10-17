const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const store = require("../utils/store");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

const DATA_DIR = path.join(__dirname, "..", "data");
const CLUBS_FILE = path.join(DATA_DIR, "clubs.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(CLUBS_FILE)) {
  fs.writeFileSync(CLUBS_FILE, JSON.stringify([], null, 2), "utf8");
}

function readClubs() {
  try {
    const raw = JSON.parse(fs.readFileSync(CLUBS_FILE, "utf8") || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeClubs(list) {
  try {
    fs.writeFileSync(CLUBS_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.warn("Failed to write clubs:", err);
  }
}

function formatUserSummary(u) {
  if (!u) return null;
  const name =
    u.name ||
    (u.email ? u.email.split("@")[0] : null) ||
    u.username ||
    "Foydalanuvchi";
  const username =
    u.username ||
    (u.email ? u.email.split("@")[0].toLowerCase() : null) ||
    "speaker";
  return {
    id: String(u.id),
    name,
    username,
    avatarUrl: u.avatarUrl || u.onboarding?.avatarUrl || null,
    isPremium: Boolean(u.isPremium),
    isVerified: Boolean(u.isVerified || u.isPremium),
  };
}

function enrichRoomUsers(room) {
  const users = store.readUsers();
  const findLive = (uid) => users.find((x) => String(x.id) === String(uid));

  const ownerLive = findLive(room.owner?.id);
  const ownerSummary = ownerLive ? formatUserSummary(ownerLive) : room.owner;

  const members = (Array.isArray(room.members) ? room.members : []).map((m) => {
    const live = findLive(m.id);
    const base = live ? formatUserSummary(live) : m;
    return {
      ...m,
      ...base,
      role: String(m.id) === String(room.owner?.id) ? "owner" : "member",
      muted: Boolean(m.muted || m.mutedByAdmin),
      mutedByAdmin: Boolean(m.mutedByAdmin),
      speaking: Boolean(m.speaking) && !m.muted && !m.mutedByAdmin,
    };
  });

  const pendingRequests = (Array.isArray(room.pendingRequests) ? room.pendingRequests : []).map(
    (reqItem) => {
      const live = findLive(reqItem.id);
      const base = live ? formatUserSummary(live) : reqItem;
      return {
        ...reqItem,
        ...base,
      };
    }
  );

  return {
    ...room,
    owner: {
      ...room.owner,
      ...ownerSummary,
    },
    members,
    pendingRequests,
    memberCount: members.length,
  };
}

/* ───────────────────────── 1. LIST ALL ACTIVE CLUB ROOMS ───────────────────────── */
router.get("/", (req, res) => {
  try {
    const clubs = readClubs().filter((c) => c && c.status !== "closed");
    const enriched = clubs.map(enrichRoomUsers);
    return res.json({
      success: true,
      rooms: enriched,
    });
  } catch (err) {
    console.error("List clubs error:", err);
    return res.status(500).json({ success: false, message: "Klub xonalarini yuklashda xatolik" });
  }
});

/* ───────────────────────── 2. CREATE A NEW CLUB ROOM ───────────────────────── */
router.post("/", authRequired, (req, res) => {
  try {
    const { name, description, maxMembers, language } = req.body || {};
    const cleanName = String(name || "").trim();
    const cleanDesc = String(description || "").trim();
    const capacity = Math.max(2, Math.min(100, Number(maxMembers) || 2));
    const lang = String(language || "en").trim().toLowerCase();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Xona nomini kiritishingiz shart",
      });
    }

    const me = store.findById(req.user.id) || req.user;
    const ownerProfile = formatUserSummary(me);
    const nowIso = new Date().toISOString();

    const newRoom = {
      id: "club_" + Date.now().toString(36) + "_" + crypto.randomBytes(3).toString("hex"),
      name: cleanName.slice(0, 120),
      description: cleanDesc.slice(0, 600),
      maxMembers: capacity,
      language: lang,
      status: "active",
      owner: ownerProfile,
      members: [
        {
          ...ownerProfile,
          role: "owner",
          muted: false,
          mutedByAdmin: false,
          speaking: false,
          joinedAt: nowIso,
        },
      ],
      pendingRequests: [],
      kickedUserIds: [],
      messages: [],
      createdAt: nowIso,
    };

    const clubs = readClubs().filter((c) => c && c.status !== "closed");
    clubs.unshift(newRoom);
    writeClubs(clubs);

    return res.status(201).json({
      success: true,
      room: enrichRoomUsers(newRoom),
      message: "Klub xonasi muvaffaqiyatli yaratildi!",
    });
  } catch (err) {
    console.error("Create club room error:", err);
    return res.status(500).json({ success: false, message: "Xona yaratishda xatolik yuz berdi" });
  }
});

/* ───────────────────────── 3. GET SINGLE CLUB ROOM DETAILS ───────────────────────── */
router.get("/:roomId", (req, res) => {
  try {
    const { roomId } = req.params;
    const clubs = readClubs();
    const room = clubs.find((c) => c && c.id === roomId && c.status !== "closed");
    if (!room) {
      return res.status(404).json({
        success: false,
        status: "closed",
        message: "Xona topilmadi yoki admin tomonidan yopilgan",
      });
    }
    return res.json({
      success: true,
      room: enrichRoomUsers(room),
    });
  } catch (err) {
    console.error("Get club room error:", err);
    return res.status(500).json({ success: false, message: "Xona ma'lumotlarini olishda xatolik" });
  }
});

/* ───────────────────────── 4. REQUEST TO JOIN CLUB ROOM ───────────────────────── */
router.post("/:roomId/request-join", authRequired, (req, res) => {
  try {
    const { roomId } = req.params;
    const clubs = readClubs();
    const idx = clubs.findIndex((c) => c && c.id === roomId && c.status !== "closed");
    if (idx < 0) {
      return res.status(404).json({
        success: false,
        message: "Xona topilmadi yoki yopilgan",
      });
    }

    const room = clubs[idx];
    const me = store.findById(req.user.id) || req.user;
    const mySummary = formatUserSummary(me);

    // Check if already a member or owner
    const isAlreadyMember = (room.members || []).some(
      (m) => String(m.id) === String(mySummary.id)
    );
    if (isAlreadyMember) {
      return res.json({
        success: true,
        joinStatus: "approved",
        room: enrichRoomUsers(room),
      });
    }

    // Check capacity
    if ((room.members || []).length >= Number(room.maxMembers || 2)) {
      return res.status(400).json({
        success: false,
        message: `Xona to'lgan (${room.maxMembers} kishilik limitga yetgan)`,
      });
    }

    // Remove from kickedUserIds if re-requesting
    room.kickedUserIds = (room.kickedUserIds || []).filter(
      (id) => String(id) !== String(mySummary.id)
    );

    const alreadyPending = (room.pendingRequests || []).some(
      (p) => String(p.id) === String(mySummary.id)
    );
    if (!alreadyPending) {
      room.pendingRequests = [
        ...(room.pendingRequests || []),
        {
          ...mySummary,
          requestedAt: new Date().toISOString(),
        },
      ];
      clubs[idx] = room;
      writeClubs(clubs);
    }

    return res.json({
      success: true,
      joinStatus: "pending",
      room: enrichRoomUsers(room),
      message: "Qo'shilish so'rovi yuborildi. Xona admini tasdiqlashini kuting.",
    });
  } catch (err) {
    console.error("Request join club error:", err);
    return res.status(500).json({ success: false, message: "Xonaga qo'shilishda xatolik" });
  }
});

/* ───────────────────────── 5. ADMIN APPROVE / REJECT JOIN REQUEST ───────────────────────── */
router.post("/:roomId/respond-request", authRequired, (req, res) => {
  try {
    const { roomId } = req.params;
    const { targetUserId, action } = req.body || {};
    const clubs = readClubs();
    const idx = clubs.findIndex((c) => c && c.id === roomId && c.status !== "closed");
    if (idx < 0) {
      return res.status(404).json({ success: false, message: "Xona topilmadi" });
    }

    const room = clubs[idx];
    if (String(room.owner?.id) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Faqat xona admini so'rovlarni tasdiqlashi mumkin",
      });
    }

    const reqEntry = (room.pendingRequests || []).find(
      (r) => String(r.id) === String(targetUserId)
    );
    if (!reqEntry) {
      return res.status(404).json({
        success: false,
        message: "So'rov topilmadi",
      });
    }

    room.pendingRequests = (room.pendingRequests || []).filter(
      (r) => String(r.id) !== String(targetUserId)
    );

    if (action === "approve") {
      if ((room.members || []).length >= Number(room.maxMembers || 2)) {
        writeClubs(clubs);
        return res.status(400).json({
          success: false,
          message: `Xona maksimal sig'imga (${room.maxMembers} kishi) yetgan!`,
        });
      }
      const alreadyIn = (room.members || []).some(
        (m) => String(m.id) === String(targetUserId)
      );
      if (!alreadyIn) {
        room.members.push({
          ...reqEntry,
          role: "member",
          muted: false,
          mutedByAdmin: false,
          speaking: false,
          joinedAt: new Date().toISOString(),
        });
      }
    }

    clubs[idx] = room;
    writeClubs(clubs);

    return res.json({
      success: true,
      room: enrichRoomUsers(room),
      message:
        action === "approve"
          ? "Foydalanuvchi xonaga qabul qilindi!"
          : "So'rov rad etildi",
    });
  } catch (err) {
    console.error("Respond club request error:", err);
    return res.status(500).json({ success: false, message: "Amalni bajarishda xatolik" });
  }
});

/* ───────────────────────── 6. ADMIN MUTE / KICK MEMBER ───────────────────────── */
router.post("/:roomId/member-action", authRequired, (req, res) => {
  try {
    const { roomId } = req.params;
    const { targetUserId, action } = req.body || {};
    const clubs = readClubs();
    const idx = clubs.findIndex((c) => c && c.id === roomId && c.status !== "closed");
    if (idx < 0) {
      return res.status(404).json({ success: false, message: "Xona topilmadi" });
    }

    const room = clubs[idx];
    if (String(room.owner?.id) !== String(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Faqat xona admini ushbu amalni bajara oladi",
      });
    }

    if (String(targetUserId) === String(room.owner?.id)) {
      return res.status(400).json({
        success: false,
        message: "Admin o'zini xonadan chiqarib yubora olmaydi",
      });
    }

    if (action === "kick") {
      room.members = (room.members || []).filter(
        (m) => String(m.id) !== String(targetUserId)
      );
      room.kickedUserIds = Array.from(
        new Set([...(room.kickedUserIds || []), String(targetUserId)])
      );
    } else if (action === "toggle-mute" || action === "mute" || action === "unmute") {
      room.members = (room.members || []).map((m) => {
        if (String(m.id) !== String(targetUserId)) return m;
        const nextMutedByAdmin =
          action === "mute"
            ? true
            : action === "unmute"
            ? false
            : !Boolean(m.mutedByAdmin);
        return {
          ...m,
          mutedByAdmin: nextMutedByAdmin,
          muted: nextMutedByAdmin ? true : m.muted,
          speaking: nextMutedByAdmin ? false : m.speaking,
        };
      });
    }

    clubs[idx] = room;
    writeClubs(clubs);

    return res.json({
      success: true,
      room: enrichRoomUsers(room),
    });
  } catch (err) {
    console.error("Club member action error:", err);
    return res.status(500).json({ success: false, message: "Amalni bajarishda xatolik" });
  }
});

/* ───────────────────────── 7. UPDATE SPEAKING / MIC STATE ───────────────────────── */
router.post("/:roomId/speaking", authRequired, (req, res) => {
  try {
    const { roomId } = req.params;
    const { muted, speaking } = req.body || {};
    const clubs = readClubs();
    const idx = clubs.findIndex((c) => c && c.id === roomId && c.status !== "closed");
    if (idx < 0) {
      return res.status(404).json({ success: false });
    }

    const room = clubs[idx];
    const myId = String(req.user.id);

    room.members = (room.members || []).map((m) => {
      if (String(m.id) !== myId) return m;
      const isForcedMute = Boolean(m.mutedByAdmin);
      const effectiveMuted = isForcedMute ? true : Boolean(muted);
      return {
        ...m,
        muted: effectiveMuted,
        speaking: effectiveMuted ? false : Boolean(speaking),
      };
    });

    clubs[idx] = room;
    writeClubs(clubs);

    return res.json({
      success: true,
      room: enrichRoomUsers(room),
    });
  } catch {
    return res.status(500).json({ success: false });
  }
});

/* ───────────────────────── 8. SEND GROUP CHAT MESSAGE IN CLUB ROOM ───────────────────────── */
router.post("/:roomId/message", authRequired, (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body || {};
    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return res.status(400).json({ success: false, message: "Xabar matni bo'sh" });
    }

    const clubs = readClubs();
    const idx = clubs.findIndex((c) => c && c.id === roomId && c.status !== "closed");
    if (idx < 0) {
      return res.status(404).json({ success: false, message: "Xona topilmadi" });
    }

    const room = clubs[idx];
    const me = store.findById(req.user.id) || req.user;
    const mySummary = formatUserSummary(me);

    const isMember = (room.members || []).some(
      (m) => String(m.id) === String(mySummary.id)
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Xabar yozish uchun xona a'zosi bo'lishingiz kerak",
      });
    }

    const msg = {
      id: "cmsg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      senderId: mySummary.id,
      senderName: mySummary.name,
      senderUsername: mySummary.username,
      senderAvatar: mySummary.avatarUrl,
      isPremium: mySummary.isPremium,
      text: cleanText.slice(0, 600),
      createdAt: new Date().toISOString(),
    };

    room.messages = [...(room.messages || []), msg].slice(-200);
    clubs[idx] = room;
    writeClubs(clubs);

    return res.json({
      success: true,
      message: msg,
      room: enrichRoomUsers(room),
    });
  } catch (err) {
    console.error("Club message error:", err);
    return res.status(500).json({ success: false, message: "Xabar yuborishda xatolik" });
  }
});

/* ───────────────────────── 9. LEAVE OR CLOSE CLUB ROOM ───────────────────────── */
router.post("/:roomId/leave", authRequired, (req, res) => {
  try {
    const { roomId } = req.params;
    const clubs = readClubs();
    const idx = clubs.findIndex((c) => c && c.id === roomId);
    if (idx < 0) {
      return res.json({ success: true, closed: true });
    }

    const room = clubs[idx];
    const myId = String(req.user.id);

    // If room creator leaves/ends the room, close & delete the room
    if (String(room.owner?.id) === myId) {
      clubs.splice(idx, 1);
      writeClubs(clubs);
      return res.json({
        success: true,
        closed: true,
        message: "Xona yopildi",
      });
    }

    // Otherwise remove this participant from members & pendingRequests
    room.members = (room.members || []).filter((m) => String(m.id) !== myId);
    room.pendingRequests = (room.pendingRequests || []).filter((p) => String(p.id) !== myId);
    clubs[idx] = room;
    writeClubs(clubs);

    return res.json({
      success: true,
      closed: false,
      room: enrichRoomUsers(room),
    });
  } catch (err) {
    console.error("Leave club error:", err);
    return res.status(500).json({ success: false, message: "Xonadan chiqishda xatolik" });
  }
});

module.exports = router;
