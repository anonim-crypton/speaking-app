const express = require("express");

const store = require("../utils/store");
const supabase = require("../lib/supabase");
const { authRequired } = require("../middleware/auth");
const { userSlug } = require("../utils/slug");

const router = express.Router();

const PURPOSES = new Set(["friends", "dating", "language"]);
const GENDERS = new Set(["male", "female", "gay", "unspecified"]);
const USERNAME_RE = /^[a-z0-9_.]{5,30}$/;

function normalizeUsername(raw) {
  return String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
}

/**
 * GET /api/onboarding/check-username?username=...
 * Checks if a username is valid (min 5 chars) and unique across all users.
 */
router.get("/check-username", authRequired, async (req, res) => {
  try {
    const cleanUsername = normalizeUsername(req.query.username);

    if (!cleanUsername || cleanUsername.length < 5) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Username must be at least 5 characters",
        code: "USERNAME_TOO_SHORT",
      });
    }

    if (!USERNAME_RE.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Username can only contain letters, numbers, _ and .",
        code: "USERNAME_INVALID",
      });
    }

    const takenLocal = store.findByUsername(cleanUsername, req.user.id);
    if (takenLocal) {
      return res.status(409).json({
        success: false,
        available: false,
        message: "This username is already taken",
        code: "USERNAME_TAKEN",
      });
    }

    const takenRemote = await supabase.isUsernameTakenInSupabase(cleanUsername, req.user.id);
    if (takenRemote) {
      return res.status(409).json({
        success: false,
        available: false,
        message: "This username is already taken",
        code: "USERNAME_TAKEN",
      });
    }

    return res.json({
      success: true,
      available: true,
      username: cleanUsername,
    });
  } catch (err) {
    console.error("Check username error:", err);
    return res.status(500).json({
      success: false,
      available: false,
      message: "Could not verify username",
    });
  }
});

/**
 * POST /api/onboarding
 * Stores the questionnaire (name, username, age, country, purpose, gender)
 * and syncs the complete profile into both local store and Supabase `profiles`.
 */
router.post("/", authRequired, async (req, res) => {
  try {
    const { age, name, username, countryCode, purpose, gender } = req.body || {};

    // 1. Validate Name (from body or existing user record)
    const rawName = name !== undefined && String(name).trim() ? String(name).trim() : req.user.name;
    const cleanName = String(rawName || "").trim();
    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Enter your name",
        code: "NAME_INVALID",
      });
    }

    // 2. Validate Username (min 5 chars, unique across all users)
    const cleanUsername = normalizeUsername(username);
    if (!cleanUsername || cleanUsername.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 5 characters",
        code: "USERNAME_TOO_SHORT",
      });
    }
    if (!USERNAME_RE.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: "Username can only contain letters, numbers, _ and .",
        code: "USERNAME_INVALID",
      });
    }

    const takenLocal = store.findByUsername(cleanUsername, req.user.id);
    const takenRemote = await supabase.isUsernameTakenInSupabase(cleanUsername, req.user.id);
    if (takenLocal || takenRemote) {
      return res.status(409).json({
        success: false,
        message: "This username is already taken",
        code: "USERNAME_TAKEN",
      });
    }

    // 3. Validate Age (if provided)
    let ageNumber = null;
    if (age !== undefined && age !== null && String(age).trim() !== "") {
      const parsedAge = Number(age);
      if (!Number.isFinite(parsedAge) || parsedAge < 10 || parsedAge > 120) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid age",
          code: "AGE_INVALID",
        });
      }
      ageNumber = Math.round(parsedAge);
    }

    // 4. Validate Country, Purpose, Gender
    if (typeof countryCode !== "string" || !/^[A-Za-z]{2}$/.test(countryCode)) {
      return res.status(400).json({ success: false, message: "Select a country" });
    }
    if (!PURPOSES.has(purpose)) {
      return res.status(400).json({ success: false, message: "Select a purpose" });
    }
    if (!GENDERS.has(gender)) {
      return res.status(400).json({ success: false, message: "Select an option" });
    }

    const upperCountry = countryCode.toUpperCase();
    const answers = {
      userId: req.user.id,
      age: ageNumber,
      countryCode: upperCountry,
      purpose,
      gender,
    };

    // 5. Update local store
    const updated =
      store.updateUser(req.user.id, {
        name: cleanName,
        username: cleanUsername,
        countryCode: upperCountry,
        age: ageNumber,
        purpose,
        gender,
        onboardingCompleted: true,
        onboarding: {
          name: cleanName,
          username: cleanUsername,
          age: ageNumber,
          countryCode: upperCountry,
          purpose,
          gender,
          answeredAt: new Date().toISOString(),
        },
      }) || req.user;

    // 6. Upsert full profile into Supabase `profiles` (works even if row didn't exist before)
    const profileSaved = await supabase.saveProfile({
      id: updated.id,
      name: cleanName,
      username: cleanUsername,
      email: updated.email || null,
      phone: updated.phone || null,
      passwordHash: updated.passwordHash || null,
      provider: updated.provider || "password",
      googleEmail: updated.googleEmail || (updated.provider === "google" ? updated.email : null),
      countryCode: upperCountry,
      region: updated.region || upperCountry,
      age: ageNumber,
      purpose,
      gender,
      diamonds: updated.diamonds || 0,
      onboardingCompleted: true,
    });
    if (!profileSaved.ok && !profileSaved.skipped) {
      console.warn("[supabase] profile upsert during onboarding failed:", profileSaved.error);
    }

    // 7. If Google user, also keep google_accounts updated with their chosen name
    if (updated.provider === "google" && updated.email) {
      await supabase.saveGoogleAccount({
        email: updated.email,
        name: cleanName,
        userId: updated.id,
      });
    }

    // 8. Insert into Supabase `onboarding_answers`
    const savedOnboarding = await supabase.saveOnboarding(answers);
    if (!savedOnboarding.ok && !savedOnboarding.skipped) {
      console.warn("[supabase] onboarding_answers insert failed:", savedOnboarding.error);
    }

    return res.json({
      success: true,
      message: "Thank you for answering",
      user: {
        id: updated.id,
        slug: userSlug(updated.id),
        name: cleanName,
        username: cleanUsername,
        email: updated.email || null,
        phone: updated.phone || null,
        provider: updated.provider || "password",
        countryCode: upperCountry,
        region: updated.region || upperCountry,
        age: ageNumber,
        purpose,
        gender,
        diamonds: updated.diamonds || 0,
        onboardingCompleted: true,
        createdAt: updated.createdAt,
      },
      supabase: supabase.supabaseStatus(),
    });
  } catch (err) {
    console.error("Onboarding error:", err);
    return res.status(500).json({ success: false, message: "Could not save your answers" });
  }
});

module.exports = router;
