const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const store = require("../utils/store");
const sessionStore = require("../utils/sessionStore");
const supabase = require("../lib/supabase");
const { authRequired, JWT_SECRET } = require("../middleware/auth");
const { userSlug } = require("../utils/slug");

const router = express.Router();

/** Countries that sign up with a phone number only by default (Uzbekistan). */
const PHONE_REGIONS = new Set(["UZ"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (user, sid = null) =>
  jwt.sign({ id: user.id, email: user.email, phone: user.phone, sid }, JWT_SECRET, {
    expiresIn: "7d",
  });

function publicUser(user) {
  return {
    id: user.id,
    slug: userSlug(user.id),
    name: user.name || null,
    username: user.username || null,
    avatarUrl: user.avatarUrl || user.onboarding?.avatarUrl || null,
    email: user.email || null,
    phone: user.phone || null,
    provider: user.provider || "password",
    countryCode: user.countryCode || user.onboarding?.countryCode || null,
    region: user.region || null,
    age: user.age ?? user.onboarding?.age ?? null,
    purpose: user.purpose ?? user.onboarding?.purpose ?? null,
    gender: user.gender ?? user.onboarding?.gender ?? null,
    diamonds: user.diamonds || 0,
    isPremium: Boolean(user.isPremium),
    isVerified: Boolean(user.isVerified),
    isBanned: Boolean(user.isBanned),
    diamondHistory: user.diamondHistory || [],
    adminMessages: user.adminMessages || [],
    onboardingCompleted: Boolean(user.onboardingCompleted && user.username),
    createdAt: user.createdAt,
  };
}

const normCountry = (value) =>
  typeof value === "string" && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null;

function hydrateUserFromProfile(profile) {
  const existing = store.findById(profile.id);
  const extractedUsername = supabase.extractProfileUsername(profile);
  if (existing) {
    return store.updateUser(profile.id, {
      name: profile.name || existing.name,
      username: extractedUsername || existing.username || null,
      avatarUrl: profile.avatar_url || existing.avatarUrl || null,
      email: profile.email || existing.email,
      phone: profile.phone || existing.phone,
      countryCode: profile.country_code || existing.countryCode,
      age: profile.age ?? existing.age ?? null,
      purpose: profile.purpose ?? existing.purpose ?? null,
      gender: profile.gender ?? existing.gender ?? null,
      diamonds: profile.diamonds ?? existing.diamonds ?? 0,
      isPremium: Boolean(profile.is_premium ?? existing.isPremium ?? false),
      isVerified: Boolean(profile.is_verified ?? existing.isVerified ?? false),
      isBanned: Boolean(profile.is_banned ?? existing.isBanned ?? false),
      onboardingCompleted: Boolean(profile.onboarding_completed),
    });
  }
  return store.createUser({
    id: profile.id,
    name: profile.name,
    username: extractedUsername,
    avatarUrl: profile.avatar_url || null,
    email: profile.email,
    phone: profile.phone,
    passwordHash: profile.password_hash,
    provider: profile.provider || "password",
    googleEmail: profile.google_email,
    countryCode: profile.country_code,
    region: profile.region,
    age: profile.age,
    purpose: profile.purpose,
    gender: profile.gender,
    diamonds: profile.diamonds || 0,
    isPremium: Boolean(profile.is_premium ?? false),
    isVerified: Boolean(profile.is_verified ?? false),
    isBanned: Boolean(profile.is_banned ?? false),
    onboardingCompleted: Boolean(profile.onboarding_completed),
  });
}

/* ─────────────────────────────── register (name / email / password) ─── */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, countryCode } = req.body || {};
    const country = normCountry(countryCode);

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }
    if (!email || !EMAIL_RE.test(String(email))) {
      return res.status(400).json({ success: false, message: "A valid email is required" });
    }
    if (!password || String(password).length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const isSupabaseEnabled = supabase.supabaseStatus().enabled;
    const existingRemote = await supabase.findRow("profiles", "email", cleanEmail);
    if (existingRemote) {
      return res.status(409).json({ success: false, message: "This email is already registered" });
    }
    if (isSupabaseEnabled) {
      store.deleteByEmail(cleanEmail);
    } else if (store.findByEmail(cleanEmail)) {
      return res.status(409).json({ success: false, message: "This email is already registered" });
    }

    /* Only the hash is ever stored — never the plaintext password. */
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = store.createUser({
      name: String(name).trim(),
      email: cleanEmail,
      passwordHash,
      provider: "password",
      countryCode: country,
      region: country,
    });

    /* Mirror into Supabase (no-op when it is not configured). */
    const saved = await supabase.saveProfile({
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash,
      provider: "password",
      countryCode: country,
      region: country,
      onboardingCompleted: false,
    });
    if (!saved.ok && !saved.skipped) {
      console.warn("[supabase] profile insert failed:", saved.error);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token: signToken(user),
      user: publicUser(user),
      onBoardingRequired: true,
      supabase: supabase.supabaseStatus(),
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
});

/* ─────────────────────────────── register (phone) ───────── */
router.post("/register-phone", async (req, res) => {
  if (String(process.env.PHONE_OTP_REQUIRED).toLowerCase() === "true") {
    return res
      .status(403)
      .json({ success: false, message: "OTP verification required", code: "OTP_REQUIRED" });
  }
  try {
    const { phone, countryCode, name } = req.body || {};
    const country = normCountry(countryCode) || "UZ";

    const cleaned = String(phone || "").replace(/\D/g, "");
    if (!/^998\d{9}$/.test(cleaned)) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid phone number" });
    }

    const isSupabaseEnabled = supabase.supabaseStatus().enabled;
    const existingRemote = await supabase.findRow("profiles", "phone", cleaned);
    if (existingRemote) {
      return res
        .status(409)
        .json({ success: false, message: "This phone number is already registered" });
    }
    if (isSupabaseEnabled) {
      store.deleteByPhone(cleaned);
    } else if (store.findByPhone(cleaned)) {
      return res
        .status(409)
        .json({ success: false, message: "This phone number is already registered" });
    }

    const user = store.createUser({
      name: name ? String(name).trim() : null,
      phone: cleaned,
      passwordHash: null,
      provider: "phone",
      countryCode: country,
      region: country,
    });

    const saved = await supabase.saveProfile({
      id: user.id,
      name: user.name,
      phone: user.phone,
      provider: "phone",
      countryCode: country,
      region: country,
      onboardingCompleted: false,
    });
    if (!saved.ok && !saved.skipped) {
      console.warn("[supabase] phone profile insert failed:", saved.error);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token: signToken(user),
      user: publicUser(user),
      onBoardingRequired: true,
      supabase: supabase.supabaseStatus(),
    });
  } catch (err) {
    console.error("Phone register error:", err);
    return res.status(500).json({ success: false, message: "Registration failed" });
  }
});

/* ─────────────────────────────── Google sign-in ─────────────────────── */
router.post("/google", async (req, res) => {
  try {
    let { email, name, countryCode, credential } = req.body || {};
    const country = normCountry(countryCode);

    if (credential) {
      try {
        const googleRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );
        const googleData = await googleRes.json();
        if (googleData && googleData.email) {
          email = googleData.email;
          if (googleData.name) name = googleData.name;
        } else {
          return res.status(401).json({ success: false, message: "Invalid Google credential" });
        }
      } catch (tokenErr) {
        console.error("Google token verification failed:", tokenErr);
        return res.status(401).json({ success: false, message: "Could not verify Google token" });
      }
    }

    if (!email || !EMAIL_RE.test(String(email))) {
      return res
        .status(400)
        .json({ success: false, message: "A valid Google email is required" });
    }
    const cleanEmail = String(email).trim().toLowerCase();

    let user = store.findByEmail(cleanEmail);
    let created = false;

    if (!user) {
      const remoteProfile = await supabase.findRow("profiles", "email", cleanEmail);
      if (remoteProfile) {
        user = hydrateUserFromProfile(remoteProfile);
      }
    }

    if (!user) {
      user = store.createUser({
        name: name ? String(name).trim() : cleanEmail.split("@")[0],
        email: cleanEmail,
        passwordHash: null,
        provider: "google",
        googleEmail: cleanEmail,
        countryCode: country,
        region: country,
      });
      created = true;
    } else if (name && (!user.name || user.name === cleanEmail.split("@")[0])) {
      user = store.updateUser(user.id, { name: String(name).trim() }) || user;
    }

    /* Always upsert into Supabase `profiles` so Google accounts are guaranteed to be in `profiles`. */
    const saved = await supabase.saveProfile({
      id: user.id,
      name: user.name,
      username: user.username || null,
      email: cleanEmail,
      provider: user.provider || "google",
      googleEmail: cleanEmail,
      countryCode: user.countryCode || user.onboarding?.countryCode || country,
      region: user.region || country,
      age: user.age ?? user.onboarding?.age ?? null,
      purpose: user.purpose ?? user.onboarding?.purpose ?? null,
      gender: user.gender ?? user.onboarding?.gender ?? null,
      diamonds: user.diamonds ?? 0,
      onboardingCompleted: Boolean(user.onboardingCompleted && user.username),
    });
    if (!saved.ok && !saved.skipped) {
      console.warn("[supabase] google profile upsert failed:", saved.error);
    }

    /* Always keep a record of the Google address. */
    const googleSaved = await supabase.saveGoogleAccount({
      email: cleanEmail,
      name: user.name,
      userId: user.id,
    });
    if (!googleSaved.ok && !googleSaved.skipped) {
      console.warn("[supabase] google_accounts upsert failed:", googleSaved.error);
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Ushbu hisob ma'muriyat (admin) tomonidan bloklangan!",
        code: "USER_BANNED",
      });
    }

    const sessionRes = sessionStore.createSession({
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    if (sessionRes.error === "DEVICE_BLOCKED") {
      return res.status(403).json({
        success: false,
        message: "Sizning qurilmangiz bu hisob tomonidan bloklangan.",
        code: "DEVICE_BLOCKED",
      });
    }
    const sid = sessionRes.session ? sessionRes.session.id : null;

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created ? "Google account created" : "Signed in with Google",
      token: signToken(user, sid),
      user: publicUser(user),
      created,
    });
  } catch (err) {
    console.error("Google sign-in error:", err);
    return res.status(500).json({ success: false, message: "Google sign-in failed" });
  }
});

/* ─────────────────────────────── login (Phone OR Email/Password) ────── */
router.post("/login", async (req, res) => {
  try {
    const { email, phone, password } = req.body || {};

    /* ── Phone login ── */
    if (phone && !email) {
      const cleaned = String(phone).replace(/\D/g, "");
      if (!/^998\d{9}$/.test(cleaned)) {
        return res.status(400).json({ success: false, message: "Enter a valid phone number" });
      }

      const isSupabaseEnabled = supabase.supabaseStatus().enabled;
      let user = null;
      if (isSupabaseEnabled) {
        const profile = await supabase.findRow("profiles", "phone", cleaned);
        if (profile) {
          user = hydrateUserFromProfile(profile);
        } else {
          store.deleteByPhone(cleaned);
        }
      } else {
        user = store.findByPhone(cleaned);
      }

      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Phone number is not registered", code: "PHONE_NOT_REGISTERED" });
      }

      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          message: "Ushbu hisob ma'muriyat (admin) tomonidan bloklangan!",
          code: "USER_BANNED",
        });
      }

      // Ensure synced in Supabase profiles in background
      void supabase
        .saveProfile({
          id: user.id,
          name: user.name,
          username: user.username || null,
          phone: user.phone,
          provider: user.provider || "phone",
          countryCode: user.countryCode || user.onboarding?.countryCode || "UZ",
          age: user.age ?? user.onboarding?.age ?? null,
          purpose: user.purpose ?? user.onboarding?.purpose ?? null,
          gender: user.gender ?? user.onboarding?.gender ?? null,
          diamonds: user.diamonds ?? 0,
          onboardingCompleted: Boolean(user.onboardingCompleted && user.username),
        })
        .catch(() => {});

      const sessionRes = sessionStore.createSession({
        userId: user.id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
      if (sessionRes.error === "DEVICE_BLOCKED") {
        return res.status(403).json({
          success: false,
          message: "Sizning qurilmangiz bu hisob tomonidan bloklangan.",
          code: "DEVICE_BLOCKED",
        });
      }
      const sid = sessionRes.session ? sessionRes.session.id : null;

      return res.json({
        success: true,
        message: "Login successful",
        token: signToken(user, sid),
        user: publicUser(user),
      });
    }

    /* ── Email + Password login ── */
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const isSupabaseEnabled = supabase.supabaseStatus().enabled;
    let user = null;
    if (isSupabaseEnabled) {
      const profile = await supabase.findRow("profiles", "email", cleanEmail);
      if (profile) {
        user = hydrateUserFromProfile(profile);
      } else {
        store.deleteByEmail(cleanEmail);
      }
    } else {
      user = store.findByEmail(cleanEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email",
        field: "email",
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: "This account was created with Google",
        field: "password",
      });
    }

    const match = await bcrypt.compare(String(password), user.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
        field: "password",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Ushbu hisob ma'muriyat (admin) tomonidan bloklangan!",
        code: "USER_BANNED",
      });
    }

    // Ensure synced in Supabase profiles
    await supabase.saveProfile({
      id: user.id,
      name: user.name,
      username: user.username || null,
      email: user.email,
      passwordHash: user.passwordHash,
      provider: user.provider || "password",
      countryCode: user.countryCode || user.onboarding?.countryCode || null,
      age: user.age ?? user.onboarding?.age ?? null,
      purpose: user.purpose ?? user.onboarding?.purpose ?? null,
      gender: user.gender ?? user.onboarding?.gender ?? null,
      diamonds: user.diamonds ?? 0,
      onboardingCompleted: Boolean(user.onboardingCompleted && user.username),
    });

    const sessionRes = sessionStore.createSession({
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    if (sessionRes.error === "DEVICE_BLOCKED") {
      return res.status(403).json({
        success: false,
        message: "Sizning qurilmangiz bu hisob tomonidan bloklangan.",
        code: "DEVICE_BLOCKED",
      });
    }
    const sid = sessionRes.session ? sessionRes.session.id : null;

    return res.json({
      success: true,
      message: "Login successful",
      token: signToken(user, sid),
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});

/* ─────────────────────────────── current user ───────────────────────── */
router.get("/me", authRequired, (req, res) => {
  res.json({ success: true, user: publicUser(req.user), sid: req.sid || null });
});

/* ─────────────────────────────── devices & sessions ─────────────────── */
router.get("/devices", authRequired, (req, res) => {
  const devices = sessionStore.getUserSessions(req.user.id, req.sid);
  res.json({ success: true, devices });
});

router.post("/devices/:id/revoke", authRequired, (req, res) => {
  const ok = sessionStore.revokeSession(req.user.id, req.params.id);
  res.json({ success: ok, message: ok ? "Seans o'chirildi" : "Seans topilmadi" });
});

router.post("/devices/:id/block", authRequired, (req, res) => {
  const ok = sessionStore.blockSession(req.user.id, req.params.id);
  res.json({ success: ok, message: ok ? "Qurilma bloklandi" : "Seans topilmadi" });
});

router.post("/devices/:id/unblock", authRequired, (req, res) => {
  const ok = sessionStore.unblockSession(req.user.id, req.params.id);
  res.json({ success: ok, message: ok ? "Qurilma blokdan chiqarildi" : "Seans topilmadi" });
});

/* ─────────────────────────────── phone OTP (Uzbekistan) ─────────────── */
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 20 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const otpStore = new Map();

const phoneDigits = (v) => String(v || "").replace(/\D/g, "");

async function deliverOtp(phone, code) {
  const gatewayToken = process.env.TELEGRAM_GATEWAY_TOKEN;
  if (!gatewayToken) {
    console.log(`[otp] (dev) code for +${phone}: ${code}`);
    return { ok: true, dev: true };
  }
  try {
    const response = await fetch("https://gatewayapi.telegram.org/sendVerificationMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify({
        phone_number: `+${phone}`,
        code,
        ttl: Math.floor(OTP_TTL_MS / 1000),
      }),
    });
    const data = await response.json();
    if (!data.ok) return { ok: false, error: data.error || "Telegram Gateway error" };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

router.post("/send-otp", async (req, res) => {
  try {
    const phone = phoneDigits(req.body && req.body.phone);
    if (!/^998\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: "Enter a valid phone number" });
    }
    if (store.findByPhone(phone)) {
      return res
        .status(409)
        .json({ success: false, message: "This phone number is already registered" });
    }

    const existing = otpStore.get(phone);
    if (existing && Date.now() - existing.sentAt < OTP_RESEND_MS) {
      const wait = Math.ceil((OTP_RESEND_MS - (Date.now() - existing.sentAt)) / 1000);
      return res
        .status(429)
        .json({ success: false, message: `Wait ${wait}s before requesting a new code`, retryAfter: wait });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const sent = await deliverOtp(phone, code);
    if (!sent.ok) {
      console.warn("[otp] delivery failed:", sent.error);
      const reason = String(sent.error || "");
      const code = /BALANCE|FUNDS|PAYMENT/i.test(reason)
        ? "OTP_NO_BALANCE"
        : /NOT_FOUND|NOT_AVAILABLE|NO_TELEGRAM|PHONE_NUMBER/i.test(reason)
        ? "OTP_NOT_ON_TELEGRAM"
        : "OTP_SEND_FAILED";
      return res.status(502).json({
        success: false,
        message: "Could not send the code",
        code,
        ...(process.env.NODE_ENV !== "production" ? { detail: reason } : {}),
      });
    }

    otpStore.set(phone, {
      code,
      sentAt: Date.now(),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    return res.json({
      success: true,
      message: "Code sent",
      resendIn: OTP_RESEND_MS / 1000,
      ...(sent.dev && process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (err) {
    console.error("send-otp error:", err);
    return res.status(500).json({ success: false, message: "Could not send the code" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const phone = phoneDigits(req.body && req.body.phone);
    const code = String((req.body && req.body.code) || "").trim();
    const country = normCountry(req.body && req.body.countryCode) || "UZ";

    const entry = otpStore.get(phone);
    if (!entry || Date.now() > entry.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({ success: false, message: "Code expired — request a new one" });
    }
    if (entry.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(phone);
      return res.status(429).json({ success: false, message: "Too many attempts — request a new code" });
    }
    if (code !== entry.code) {
      entry.attempts += 1;
      return res.status(400).json({ success: false, message: "Incorrect code" });
    }
    otpStore.delete(phone);

    let user = store.findByPhone(phone);
    if (!user) {
      user = store.createUser({
        name: null,
        phone,
        passwordHash: null,
        provider: "phone",
        countryCode: country,
        region: country,
      });
      const saved = await supabase.saveProfile({
        id: user.id,
        phone: user.phone,
        provider: "phone",
        countryCode: country,
        region: country,
        onboardingCompleted: false,
      });
      if (!saved.ok && !saved.skipped) {
        console.warn("[supabase] phone profile insert failed:", saved.error);
      }
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Ushbu hisob ma'muriyat (admin) tomonidan bloklangan!",
        code: "USER_BANNED",
      });
    }

    const sessionRes = sessionStore.createSession({
      userId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    if (sessionRes.error === "DEVICE_BLOCKED") {
      return res.status(403).json({
        success: false,
        message: "Sizning qurilmangiz bu hisob tomonidan bloklangan.",
        code: "DEVICE_BLOCKED",
      });
    }
    const sid = sessionRes.session ? sessionRes.session.id : null;

    return res.status(201).json({
      success: true,
      message: "Phone verified",
      token: signToken(user, sid),
      user: publicUser(user),
      onBoardingRequired: true,
    });
  } catch (err) {
    console.error("verify-otp error:", err);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
});

/* ─────────────────────────────── User Messages (Admin <-> User) ─────── */
router.get("/messages", authRequired, async (req, res) => {
  try {
    const user = store.findById(req.user.id) || req.user;
    const localMsgs = user.adminMessages || [];
    const remoteMsgs = await supabase.getMessages(user.id);

    // Merge remote and local if remote exists
    const mergedMap = new Map();
    localMsgs.forEach((m) => mergedMap.set(m.id || `${m.createdAt}_${m.text}`, m));
    remoteMsgs.forEach((rm) => {
      const key = rm.id || `${rm.created_at}_${rm.text}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          id: String(rm.id),
          text: rm.text,
          isAdmin: Boolean(rm.is_admin),
          sender: rm.is_admin ? "Admin" : (rm.name || user.name || "Siz"),
          createdAt: rm.created_at,
          read: true,
        });
      }
    });

    const allMessages = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const unreadCount = allMessages.filter((m) => m.isAdmin && !m.read).length;

    return res.json({
      success: true,
      messages: allMessages,
      unreadCount,
    });
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
});

router.post("/messages", authRequired, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ success: false, message: "Xabar matni kiritilishi shart" });
    }

    const cleanText = String(text).trim();
    const user = store.findById(req.user.id) || req.user;
    const newMsg = {
      id: "msg_" + Date.now(),
      text: cleanText,
      isAdmin: false,
      sender: user.name || user.username || "Foydalanuvchi",
      createdAt: new Date().toISOString(),
      read: true,
    };

    const currentList = user.adminMessages || [];
    currentList.push(newMsg);
    store.updateUser(user.id, { adminMessages: currentList });

    // Save to Supabase messages table
    void supabase.saveMessage({
      userId: user.id,
      name: user.name,
      username: user.username,
      text: cleanText,
      isAdmin: false,
    });

    return res.status(201).json({
      success: true,
      message: newMsg,
      messages: currentList,
    });
  } catch (err) {
    console.error("Send message error:", err);
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

router.post("/messages/read", authRequired, async (req, res) => {
  try {
    const user = store.findById(req.user.id) || req.user;
    const currentList = (user.adminMessages || []).map((m) => ({ ...m, read: true }));
    store.updateUser(user.id, { adminMessages: currentList });
    return res.json({ success: true, unreadCount: 0 });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
});

/**
 * POST /api/auth/upload-avatar
 * Accepts base64 image, writes to backend/media/avatars/, saves URL to user and Supabase.
 */
router.post("/upload-avatar", authRequired, async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ success: false, message: "Rasm ma'lumotlari kiritilmadi" });
    }

    const matches = image.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    let ext = "jpg";
    let buffer;
    if (matches) {
      ext = matches[1].toLowerCase();
      if (ext === "jpeg") ext = "jpg";
      if (ext === "svg+xml") ext = "svg";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(image, "base64");
    }

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ success: false, message: "Yaroqsiz rasm formati" });
    }

    const uploadDir = path.join(__dirname, "../media/avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `avatar_${req.user.id}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    const avatarUrl = `/media/avatars/${filename}`;

    // Update local store
    store.updateUser(req.user.id, { avatarUrl });

    // Update Supabase
    void supabase.updateRow("profiles", "id", req.user.id, { avatar_url: avatarUrl });

    return res.json({
      success: true,
      avatarUrl,
      message: "Profil rasmi muvaffaqiyatli saqlandi",
    });
  } catch (err) {
    console.error("Upload avatar error:", err);
    return res.status(500).json({ success: false, message: "Rasmni yuklashda xatolik yuz berdi" });
  }
});

module.exports = router;
module.exports.PHONE_REGIONS = PHONE_REGIONS;
module.exports.publicUser = publicUser;
