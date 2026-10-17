const express = require("express");
const fs = require("fs");
const path = require("path");
const store = require("../utils/store");
const supabase = require("../lib/supabase");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

const DATA_DIR = path.join(__dirname, "..", "data");
const DM_FILE = path.join(DATA_DIR, "direct_messages.json");
const BOOKS_FILE = path.join(DATA_DIR, "books.json");
const BOOKS_MEDIA_DIR = path.join(__dirname, "..", "media", "books");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BOOKS_MEDIA_DIR)) {
  fs.mkdirSync(BOOKS_MEDIA_DIR, { recursive: true });
}
if (!fs.existsSync(DM_FILE)) {
  fs.writeFileSync(DM_FILE, JSON.stringify([], null, 2), "utf8");
}
if (!fs.existsSync(BOOKS_FILE)) {
  fs.writeFileSync(BOOKS_FILE, JSON.stringify([], null, 2), "utf8");
}

function readDMs() {
  try {
    const raw = JSON.parse(fs.readFileSync(DM_FILE, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeDMs(list) {
  try {
    fs.writeFileSync(DM_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (e) {
    console.warn("Failed to write direct messages:", e);
  }
}

function readBooks() {
  try {
    const raw = JSON.parse(fs.readFileSync(BOOKS_FILE, "utf8"));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function writeBooks(list) {
  try {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (e) {
    console.warn("Failed to write books:", e);
  }
}

function formatPublicProfile(u) {
  if (!u) return null;
  const fallbackName =
    u.name ||
    (u.email ? u.email.split("@")[0] : null) ||
    u.username ||
    "Foydalanuvchi";
  const fallbackUsername =
    u.username ||
    (u.email ? u.email.split("@")[0].toLowerCase() : null) ||
    String(u.id || "user").slice(0, 8);
  const xp = Number(u.xp || 0);
  const level = Math.floor(xp / 100) + 1;
  return {
    id: u.id,
    name: fallbackName,
    username: fallbackUsername,
    avatarUrl: u.avatarUrl || u.onboarding?.avatarUrl || null,
    isPremium: Boolean(u.isPremium),
    isVerified: Boolean(u.isVerified),
    diamonds: Number(u.diamonds) || 0,
    xp,
    level,
    streakDays: Math.max(1, Number(u.streakDays) || 1),
    talkSeconds: Number(u.talkSeconds) || 0,
    countryCode: u.countryCode || u.onboarding?.countryCode || "UZ",
    lastActiveAt: u.lastActiveAt || u.updatedAt || u.createdAt || new Date().toISOString(),
  };
}

function touchTalkHistoryBetween(userAId, userBId) {
  const userA = store.findById(userAId);
  const userB = store.findById(userBId);
  if (!userA || !userB) return;

  const nowIso = new Date().toISOString();
  const profB = formatPublicProfile(userB);
  const profA = formatPublicProfile(userA);

  const histA = Array.isArray(userA.talkHistory) ? [...userA.talkHistory] : [];
  const filteredA = histA.filter((h) => h.partnerId !== userB.id && h.username !== profB.username);
  filteredA.unshift({
    id: "hist_" + Date.now() + "_a",
    partnerId: userB.id,
    name: profB.name,
    username: profB.username,
    avatarUrl: profB.avatarUrl,
    isPremium: profB.isPremium,
    isVerified: profB.isVerified,
    talkedAt: nowIso,
  });
  store.updateUser(userA.id, { talkHistory: filteredA.slice(0, 100) });

  const histB = Array.isArray(userB.talkHistory) ? [...userB.talkHistory] : [];
  const filteredB = histB.filter((h) => h.partnerId !== userA.id && h.username !== profA.username);
  filteredB.unshift({
    id: "hist_" + Date.now() + "_b",
    partnerId: userA.id,
    name: profA.name,
    username: profA.username,
    avatarUrl: profA.avatarUrl,
    isPremium: profA.isPremium,
    isVerified: profA.isVerified,
    talkedAt: nowIso,
  });
  store.updateUser(userB.id, { talkHistory: filteredB.slice(0, 100) });
}

/* ───────────────────────── 1. TALK HISTORY ───────────────────────── */
router.get("/history", authRequired, (req, res) => {
  try {
    const me = store.findById(req.user.id) || req.user;
    const rawHistory = Array.isArray(me.talkHistory) ? me.talkHistory : [];
    const allUsers = store.readUsers();

    const enriched = rawHistory.map((item) => {
      const livePartner =
        allUsers.find((u) => u.id === item.partnerId) ||
        allUsers.find(
          (u) =>
            u.username &&
            item.username &&
            String(u.username).toLowerCase() === String(item.username).toLowerCase()
        );
      if (livePartner) {
        const prof = formatPublicProfile(livePartner);
        return {
          id: item.id || `hist_${livePartner.id}`,
          partnerId: livePartner.id,
          name: prof.name,
          username: prof.username,
          avatarUrl: prof.avatarUrl,
          isPremium: prof.isPremium,
          isVerified: prof.isVerified,
          language: item.language || "uz",
          durationSeconds: Number(item.durationSeconds || 0),
          talkedAt: item.talkedAt || livePartner.updatedAt || new Date().toISOString(),
        };
      }
      return {
        id: item.id || `hist_${item.partnerId}`,
        partnerId: item.partnerId,
        name: item.name || "Foydalanuvchi",
        username: item.username || "speaker",
        avatarUrl: item.avatarUrl || null,
        isPremium: Boolean(item.isPremium),
        isVerified: Boolean(item.isVerified),
        language: item.language || "uz",
        durationSeconds: Number(item.durationSeconds || 0),
        talkedAt: item.talkedAt || new Date().toISOString(),
      };
    });

    return res.json({ success: true, history: enriched });
  } catch (err) {
    console.error("Get talk history error:", err);
    return res.status(500).json({ success: false, message: "Tarixni yuklashda xatolik" });
  }
});

/* ───────────────────────── 2. FRIENDS & SEARCH ───────────────────────── */
router.get("/search", authRequired, (req, res) => {
  try {
    const q = String(req.query.q || "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();
    const me = store.findById(req.user.id) || req.user;
    const myFriends = Array.isArray(me.friends) ? me.friends : [];
    const myIncoming = Array.isArray(me.friendRequestsIn) ? me.friendRequestsIn : [];
    const myOutgoing = Array.isArray(me.friendRequestsOut) ? me.friendRequestsOut : [];

    const allUsers = store.readUsers().filter((u) => u && u.id !== me.id && !u.isBanned);

    const matched = allUsers
      .filter((u) => {
        if (!q) return Boolean(u.username || u.name);
        const uName = String(u.name || "").toLowerCase();
        const uUsername = String(u.username || "").toLowerCase();
        return uName.includes(q) || uUsername.includes(q);
      })
      .slice(0, 30)
      .map((u) => {
        const prof = formatPublicProfile(u);
        let relation = "none";
        if (myFriends.some((f) => (typeof f === "string" ? f === u.id : f.userId === u.id))) {
          relation = "friends";
        } else if (myIncoming.some((r) => (typeof r === "string" ? r === u.id : r.fromUserId === u.id))) {
          relation = "incoming";
        } else if (myOutgoing.includes(u.id)) {
          relation = "outgoing";
        }
        return {
          ...prof,
          relation,
        };
      });

    return res.json({ success: true, users: matched });
  } catch (err) {
    console.error("User search error:", err);
    return res.status(500).json({ success: false, message: "Qidiruvda xatolik" });
  }
});

router.get("/friends", authRequired, (req, res) => {
  try {
    const me = store.findById(req.user.id) || req.user;
    const allUsers = store.readUsers();

    const rawFriends = Array.isArray(me.friends) ? me.friends : [];
    const rawIncoming = Array.isArray(me.friendRequestsIn) ? me.friendRequestsIn : [];
    const rawOutgoing = Array.isArray(me.friendRequestsOut) ? me.friendRequestsOut : [];

    const friends = rawFriends
      .map((entry) => {
        const fId = typeof entry === "string" ? entry : entry.userId;
        const since = typeof entry === "object" && entry.since ? entry.since : me.createdAt;
        const target = allUsers.find((u) => u.id === fId);
        if (!target) return null;
        return {
          ...formatPublicProfile(target),
          since,
        };
      })
      .filter(Boolean);

    const incomingRequests = rawIncoming
      .map((entry) => {
        const fromId = typeof entry === "string" ? entry : entry.fromUserId;
        const createdAt =
          typeof entry === "object" && entry.createdAt ? entry.createdAt : new Date().toISOString();
        const sender = allUsers.find((u) => u.id === fromId);
        if (!sender) return null;
        return {
          ...formatPublicProfile(sender),
          fromUserId: sender.id,
          createdAt,
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      friends,
      incomingRequests,
      outgoingRequests: rawOutgoing,
    });
  } catch (err) {
    console.error("Get friends error:", err);
    return res.status(500).json({ success: false, message: "Do'stlar ro'yxatini yuklashda xatolik" });
  }
});

router.post("/friends/request", authRequired, (req, res) => {
  try {
    const targetUserId = req.body?.toUserId || req.body?.targetUserId;
    if (!targetUserId || targetUserId === req.user.id) {
      return res.status(400).json({ success: false, message: "Noto'g'ri foydalanuvchi" });
    }

    const me = store.findById(req.user.id);
    const target = store.findById(targetUserId);
    if (!me || !target) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    const myFriends = Array.isArray(me.friends) ? [...me.friends] : [];
    const alreadyFriend = myFriends.some((f) => (typeof f === "string" ? f === target.id : f.userId === target.id));
    if (alreadyFriend) {
      return res.json({ success: true, status: "friends", message: "Siz allaqachon do'stsiz" });
    }

    const myIncoming = Array.isArray(me.friendRequestsIn) ? [...me.friendRequestsIn] : [];
    const theyRequestedMe = myIncoming.some((r) =>
      typeof r === "string" ? r === target.id : r.fromUserId === target.id
    );

    const nowIso = new Date().toISOString();

    if (theyRequestedMe) {
      const nextMyIncoming = myIncoming.filter((r) =>
        typeof r === "string" ? r !== target.id : r.fromUserId !== target.id
      );
      myFriends.unshift({ userId: target.id, since: nowIso });
      store.updateUser(me.id, {
        friends: myFriends,
        friendRequestsIn: nextMyIncoming,
      });

      const targetFriends = Array.isArray(target.friends) ? [...target.friends] : [];
      if (!targetFriends.some((f) => (typeof f === "string" ? f === me.id : f.userId === me.id))) {
        targetFriends.unshift({ userId: me.id, since: nowIso });
      }
      const targetOut = (Array.isArray(target.friendRequestsOut) ? target.friendRequestsOut : []).filter(
        (id) => id !== me.id
      );
      store.updateUser(target.id, {
        friends: targetFriends,
        friendRequestsOut: targetOut,
      });

      return res.json({
        success: true,
        status: "accepted",
        message: "Do'stlik taklifi qabul qilindi!",
      });
    }

    const myOutgoing = Array.isArray(me.friendRequestsOut) ? [...me.friendRequestsOut] : [];
    if (!myOutgoing.includes(target.id)) {
      myOutgoing.push(target.id);
      store.updateUser(me.id, { friendRequestsOut: myOutgoing });
    }

    const targetIncoming = Array.isArray(target.friendRequestsIn) ? [...target.friendRequestsIn] : [];
    const alreadyInTarget = targetIncoming.some((r) =>
      typeof r === "string" ? r === me.id : r.fromUserId === me.id
    );
    if (!alreadyInTarget) {
      targetIncoming.unshift({ fromUserId: me.id, createdAt: nowIso });
      store.updateUser(target.id, { friendRequestsIn: targetIncoming });
    }

    return res.json({
      success: true,
      status: "sent",
      message: "Do'stlashish taklifi yuborildi!",
    });
  } catch (err) {
    console.error("Friend request error:", err);
    return res.status(500).json({ success: false, message: "Taklif yuborishda xatolik" });
  }
});

router.post("/friends/respond", authRequired, (req, res) => {
  try {
    const requesterId = req.body?.fromUserId || req.body?.requesterId;
    const action = req.body?.action;
    if (!requesterId || !["accept", "reject"].includes(action)) {
      return res.status(400).json({ success: false, message: "Noto'g'ri so'rov" });
    }

    const me = store.findById(req.user.id);
    const requester = store.findById(requesterId);
    if (!me) {
      return res.status(404).json({ success: false, message: "Foydalanuvchi topilmadi" });
    }

    const nowIso = new Date().toISOString();
    const myIncoming = (Array.isArray(me.friendRequestsIn) ? me.friendRequestsIn : []).filter((r) =>
      typeof r === "string" ? r !== requesterId : r.fromUserId !== requesterId
    );
    const myFriends = Array.isArray(me.friends) ? [...me.friends] : [];

    if (action === "accept") {
      if (!myFriends.some((f) => (typeof f === "string" ? f === requesterId : f.userId === requesterId))) {
        myFriends.unshift({ userId: requesterId, since: nowIso });
      }
      store.updateUser(me.id, {
        friends: myFriends,
        friendRequestsIn: myIncoming,
      });

      if (requester) {
        const reqFriends = Array.isArray(requester.friends) ? [...requester.friends] : [];
        if (!reqFriends.some((f) => (typeof f === "string" ? f === me.id : f.userId === me.id))) {
          reqFriends.unshift({ userId: me.id, since: nowIso });
        }
        const reqOut = (Array.isArray(requester.friendRequestsOut) ? requester.friendRequestsOut : []).filter(
          (id) => id !== me.id
        );
        store.updateUser(requester.id, {
          friends: reqFriends,
          friendRequestsOut: reqOut,
        });
      }

      return res.json({ success: true, message: "Do'stlik taklifi qabul qilindi!" });
    } else {
      store.updateUser(me.id, { friendRequestsIn: myIncoming });
      if (requester) {
        const reqOut = (Array.isArray(requester.friendRequestsOut) ? requester.friendRequestsOut : []).filter(
          (id) => id !== me.id
        );
        store.updateUser(requester.id, { friendRequestsOut: reqOut });
      }
      return res.json({ success: true, message: "Do'stlik taklifi rad etildi" });
    }
  } catch (err) {
    console.error("Respond friend request error:", err);
    return res.status(500).json({ success: false, message: "Amalni bajarishda xatolik" });
  }
});

router.post("/friends/remove", authRequired, (req, res) => {
  try {
    const { friendId } = req.body || {};
    if (!friendId) {
      return res.status(400).json({ success: false, message: "Do'st ID ko'rsatilmadi" });
    }

    const me = store.findById(req.user.id);
    const friend = store.findById(friendId);

    if (me) {
      const nextMyFriends = (Array.isArray(me.friends) ? me.friends : []).filter((f) =>
        typeof f === "string" ? f !== friendId : f.userId !== friendId
      );
      store.updateUser(me.id, { friends: nextMyFriends });
    }

    if (friend) {
      const nextTheirFriends = (Array.isArray(friend.friends) ? friend.friends : []).filter((f) =>
        typeof f === "string" ? f !== req.user.id : f.userId !== req.user.id
      );
      store.updateUser(friend.id, { friends: nextTheirFriends });
    }

    return res.json({ success: true, message: "Do'stlar ro'yxatidan o'chirildi" });
  } catch (err) {
    console.error("Remove friend error:", err);
    return res.status(500).json({ success: false, message: "O'chirishda xatolik" });
  }
});

/* ───────────────────────── 3. DIRECT MESSAGES (USER <-> USER CHAT) ───────────────────────── */
router.get("/dm/:partnerId", authRequired, (req, res) => {
  try {
    const myId = req.user.id;
    const partnerId = req.params.partnerId;
    const partner = store.findById(partnerId);
    const allDMs = readDMs();

    const conversation = allDMs
      .filter((m) => {
        const f = m.fromUserId || m.fromId;
        const t = m.toUserId || m.toId;
        return (f === myId && t === partnerId) || (f === partnerId && t === myId);
      })
      .map((m) => ({
        ...m,
        fromUserId: m.fromUserId || m.fromId,
        toUserId: m.toUserId || m.toId,
      }))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.json({
      success: true,
      partner: partner ? formatPublicProfile(partner) : null,
      messages: conversation,
    });
  } catch (err) {
    console.error("Get DM error:", err);
    return res.status(500).json({ success: false, message: "Xabarlarni yuklashda xatolik" });
  }
});

router.post("/dm/:partnerId", authRequired, (req, res) => {
  try {
    const myId = req.user.id;
    const partnerId = req.params.partnerId;
    const text = String((req.body && req.body.text) || "").trim();
    if (!text) {
      return res.status(400).json({ success: false, message: "Xabar matni bo'sh bo'lishi mumkin emas" });
    }

    const me = store.findById(myId) || req.user;
    const allDMs = readDMs();
    const newMsg = {
      id: "dm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      fromId: myId,
      toId: partnerId,
      fromUserId: myId,
      toUserId: partnerId,
      senderName: me.name || me.username || "Foydalanuvchi",
      senderUsername: me.username || "speaker",
      text,
      createdAt: new Date().toISOString(),
    };
    allDMs.push(newMsg);
    writeDMs(allDMs.slice(-2000));

    touchTalkHistoryBetween(myId, partnerId);

    const conversation = allDMs
      .filter((m) => {
        const f = m.fromUserId || m.fromId;
        const t = m.toUserId || m.toId;
        return (f === myId && t === partnerId) || (f === partnerId && t === myId);
      })
      .map((m) => ({
        ...m,
        fromUserId: m.fromUserId || m.fromId,
        toUserId: m.toUserId || m.toId,
      }));

    return res.status(201).json({
      success: true,
      message: newMsg,
      messages: conversation,
    });
  } catch (err) {
    console.error("Send DM error:", err);
    return res.status(500).json({ success: false, message: "Xabar yuborishda xatolik" });
  }
});

/* ───────────────────────── 4. LEADERBOARD / REYTING ───────────────────────── */
router.get("/leaderboard", (req, res) => {
  try {
    const allUsers = store
      .readUsers()
      .filter((u) => u && !u.isBanned && (u.name || u.username));

    const formatted = allUsers
      .map((u) => {
        const prof = formatPublicProfile(u);
        const score =
          prof.diamonds * 10 +
          prof.streakDays * 35 +
          Math.floor(prof.talkSeconds / 60) * 5 +
          prof.xp * 2;
        return {
          ...prof,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({
        ...item,
        rank: idx + 1,
      }));

    return res.json({
      success: true,
      leaderboard: formatted,
      users: formatted,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return res.status(500).json({ success: false, message: "Reytingni yuklashda xatolik" });
  }
});

/* ───────────────────────── 5. DAILY TASKS & GAME COMPLETION (+1 OLMO & +XP) ───────────────────────── */
router.post("/tasks/complete", authRequired, async (req, res) => {
  try {
    const { taskId, language, xpEarned = 20 } = req.body || {};
    if (!taskId) {
      return res.status(400).json({ success: false, message: "Topshiriq ID kiritilmadi" });
    }
    const user = store.findById(req.user.id) || req.user;
    const todayStr = new Date().toISOString().slice(0, 10);
    const taskKey = `${todayStr}:${language || "en"}:${taskId}`;
    const completedList = Array.isArray(user.completedDailyTasks) ? [...user.completedDailyTasks] : [];

    if (completedList.includes(taskKey)) {
      const curXp = Number(user.xp || 0);
      return res.json({
        success: true,
        alreadyCompleted: true,
        diamonds: Number(user.diamonds || 0),
        xp: curXp,
        level: Math.floor(curXp / 100) + 1,
        completedDailyTasks: completedList,
        message: "Ushbu kunlik topshiriq allaqachon bajarilgan",
      });
    }

    completedList.push(taskKey);
    const addedXp = Math.max(5, Math.min(100, Number(xpEarned) || 20));
    const newDiamonds = Number(user.diamonds || 0) + 1;
    const newXp = Number(user.xp || 0) + addedXp;
    const newLevel = Math.floor(newXp / 100) + 1;
    const totalTasksCompleted = Number(user.totalTasksCompleted || 0) + 1;

    const history = Array.isArray(user.diamondHistory) ? [...user.diamondHistory] : [];
    history.unshift({
      id: "task_" + Date.now(),
      amount: 1,
      reason: `Kunlik topshiriq bajarildi (+1 Olmos, +${addedXp} XP)`,
      createdAt: new Date().toISOString(),
    });

    store.updateUser(user.id, {
      diamonds: newDiamonds,
      xp: newXp,
      level: newLevel,
      completedDailyTasks: completedList.slice(-500),
      totalTasksCompleted,
      diamondHistory: history.slice(0, 200),
    });

    void supabase.updateRow("profiles", "id", user.id, { diamonds: newDiamonds });

    return res.json({
      success: true,
      diamonds: newDiamonds,
      xp: newXp,
      level: newLevel,
      completedDailyTasks: completedList,
      totalTasksCompleted,
      message: `Topshiriq bajarildi! +1 ta Olmos va +${addedXp} XP qo'shildi!`,
    });
  } catch (err) {
    console.error("Complete task error:", err);
    return res.status(500).json({ success: false, message: "Topshiriqni saqlashda xatolik" });
  }
});

router.post("/game/complete", authRequired, async (req, res) => {
  try {
    const { xpEarned = 25, diamondsEarned = 1 } = req.body || {};
    const user = store.findById(req.user.id) || req.user;
    const addedXp = Math.max(5, Math.min(150, Number(xpEarned) || 25));
    const addedDiamonds = Math.max(0, Math.min(5, Number(diamondsEarned) || 1));

    const newDiamonds = Number(user.diamonds || 0) + addedDiamonds;
    const newXp = Number(user.xp || 0) + addedXp;
    const newLevel = Math.floor(newXp / 100) + 1;

    const history = Array.isArray(user.diamondHistory) ? [...user.diamondHistory] : [];
    if (addedDiamonds > 0) {
      history.unshift({
        id: "game_" + Date.now(),
        amount: addedDiamonds,
        reason: `Topshiriqli o'yin g'alabasi (+${addedDiamonds} Olmos, +${addedXp} XP)`,
        createdAt: new Date().toISOString(),
      });
    }

    store.updateUser(user.id, {
      diamonds: newDiamonds,
      xp: newXp,
      level: newLevel,
      diamondHistory: history.slice(0, 200),
    });

    if (addedDiamonds > 0) {
      void supabase.updateRow("profiles", "id", user.id, { diamonds: newDiamonds });
    }

    return res.json({
      success: true,
      diamonds: newDiamonds,
      xp: newXp,
      level: newLevel,
      message: `O'yin yakunlandi! +${addedDiamonds} ta Olmos va +${addedXp} XP olindi!`,
    });
  } catch (err) {
    console.error("Complete game error:", err);
    return res.status(500).json({ success: false, message: "O'yin natijasini saqlashda xatolik" });
  }
});

/* ───────────────────────── 6. FOYDALI KITOBLAR (ADMIN UPLOAD & USER VIEW) ───────────────────────── */
router.get("/books", (req, res) => {
  try {
    const books = readBooks();
    return res.json({
      success: true,
      books,
    });
  } catch (err) {
    console.error("Get books error:", err);
    return res.status(500).json({ success: false, message: "Kitoblarni yuklashda xatolik" });
  }
});

router.post("/books", (req, res) => {
  try {
    const {
      title,
      bio,
      coverImageBase64,
      coverImageName,
      bookFileBase64,
      bookFileName,
      bookFileSize,
    } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: "Kitob nomi kiritilishi shart" });
    }
    if (!bookFileBase64) {
      return res.status(400).json({ success: false, message: "Kitob fayli yuklanishi shart" });
    }

    let coverUrl = null;
    if (coverImageBase64 && typeof coverImageBase64 === "string") {
      const imgMatch = coverImageBase64.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      let ext = "jpg";
      let buf;
      if (imgMatch) {
        ext = imgMatch[1].toLowerCase();
        if (ext === "jpeg") ext = "jpg";
        buf = Buffer.from(imgMatch[2], "base64");
      } else {
        buf = Buffer.from(coverImageBase64, "base64");
      }
      const coverFile = `cover_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
      fs.writeFileSync(path.join(BOOKS_MEDIA_DIR, coverFile), buf);
      coverUrl = `/media/books/${coverFile}`;
    }

    let fileUrl = null;
    const rawFileStr = String(bookFileBase64);
    const dataPrefixIdx = rawFileStr.indexOf(";base64,");
    const base64Data = dataPrefixIdx >= 0 ? rawFileStr.slice(dataPrefixIdx + 8) : rawFileStr;
    const fileBuf = Buffer.from(base64Data, "base64");

    const safeOriginalName = String(bookFileName || "book.pdf")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-80);
    const savedFileName = `book_${Date.now()}_${safeOriginalName}`;
    fs.writeFileSync(path.join(BOOKS_MEDIA_DIR, savedFileName), fileBuf);
    fileUrl = `/media/books/${savedFileName}`;

    const newBook = {
      id: "book_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      title: String(title).trim(),
      bio: String(bio || "").trim(),
      coverUrl,
      fileUrl,
      fileName: bookFileName || safeOriginalName,
      fileSize: bookFileSize || fileBuf.length,
      createdAt: new Date().toISOString(),
    };

    const books = readBooks();
    books.unshift(newBook);
    writeBooks(books);

    return res.status(201).json({
      success: true,
      book: newBook,
      books,
      message: "Kitob muvaffaqiyatli yuklandi!",
    });
  } catch (err) {
    console.error("Upload book error:", err);
    return res.status(500).json({ success: false, message: "Kitobni yuklashda xatolik yuz berdi" });
  }
});

router.delete("/books/:bookId", (req, res) => {
  try {
    const { bookId } = req.params;
    const books = readBooks();
    const filtered = books.filter((b) => b.id !== bookId);
    writeBooks(filtered);
    return res.json({
      success: true,
      books: filtered,
      message: "Kitob o'chirildi",
    });
  } catch (err) {
    console.error("Delete book error:", err);
    return res.status(500).json({ success: false, message: "Kitobni o'chirishda xatolik" });
  }
});

module.exports = router;
