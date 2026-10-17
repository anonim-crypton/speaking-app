/**
 * Supabase access layer.
 *
 * Optional by design: if the SDK is not installed, or SUPABASE_URL /
 * SUPABASE_SERVICE_KEY are missing from backend/.env, every helper here
 * degrades to a no-op and the API keeps working against the local JSON store.
 */

const crypto = require("crypto");

let createClient = null;
try {
  ({ createClient } = require("@supabase/supabase-js"));
} catch {
  createClient = null;
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let client = null;
let reason = "";

if (!createClient) {
  reason = "@supabase/supabase-js is not installed (run: npm install --prefix backend)";
} else if (!url || !key) {
  reason = "SUPABASE_URL / SUPABASE_SERVICE_KEY are not set in backend/.env";
} else {
  try {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    reason = `Supabase client init failed: ${err.message}`;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isSupabaseEnabled = () => client !== null;
const getSupabase = () => client;
const supabaseStatus = () => ({ enabled: isSupabaseEnabled(), reason });

/** Insert one row. Never throws — returns { ok, data?, error? }. */
async function insertRow(table, row) {
  if (!client) return { ok: false, skipped: true, error: reason };
  try {
    const { data, error } = await client.from(table).insert(row).select().single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Select a single row by a column value. Never throws. */
async function findRow(table, column, value) {
  if (!client || value === undefined || value === null) return null;
  try {
    const { data, error } = await client
      .from(table)
      .select("*")
      .eq(column, value)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

/** Update a row by a column value. Never throws. */
async function updateRow(table, column, value, patch) {
  if (!client) return { ok: false, skipped: true, error: reason };
  try {
    const { data, error } = await client
      .from(table)
      .update(patch)
      .eq(column, value)
      .select()
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Extracts username from a Supabase profile row (supports both `username` column and `@username` in `region`). */
function extractProfileUsername(profile) {
  if (!profile) return null;
  if (typeof profile.username === "string" && profile.username.trim()) {
    return profile.username.trim().replace(/^@+/, "").toLowerCase();
  }
  if (typeof profile.region === "string" && profile.region.startsWith("@")) {
    return profile.region.slice(1).trim().toLowerCase();
  }
  return null;
}

/**
 * Checks if a username is already taken in Supabase `profiles`.
 */
async function isUsernameTakenInSupabase(username, excludeUserId = null) {
  if (!client || !username) return false;
  const clean = String(username).trim().replace(/^@+/, "").toLowerCase();
  if (!clean) return false;

  try {
    // 1. Try direct `username` column query (case-insensitive)
    const { data, error } = await client
      .from("profiles")
      .select("id, username, region")
      .ilike("username", clean)
      .limit(5);

    if (!error && Array.isArray(data)) {
      const taken = data.some((row) => row.id !== excludeUserId);
      if (taken) return true;
    }

    // 2. Also check fallback `@username` stored in `region`
    const { data: regionData } = await client
      .from("profiles")
      .select("id, region")
      .ilike("region", `@${clean}`)
      .limit(5);

    if (Array.isArray(regionData)) {
      return regionData.some((row) => row.id !== excludeUserId);
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Creates or updates the full profile row in Supabase `profiles`.
 * Gracefully handles whether `username` column exists in Postgres or not.
 */
async function saveProfile({
  id,
  name = null,
  username = null,
  email = null,
  phone = null,
  passwordHash = null,
  provider = "password",
  googleEmail = null,
  countryCode = null,
  region = null,
  age = null,
  purpose = null,
  gender = null,
  diamonds = undefined,
  onboardingCompleted = undefined,
  avatarUrl = undefined,
}) {
  if (!client) return { ok: false, skipped: true, error: reason };
  const validId = id && UUID_RE.test(String(id)) ? id : crypto.randomUUID();
  const cleanUsername = username
    ? String(username).trim().replace(/^@+/, "").toLowerCase()
    : null;

  const basePayload = {
    id: validId,
    ...(name !== undefined ? { name } : {}),
    ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {}),
    ...(email !== undefined && email !== null ? { email } : {}),
    ...(phone !== undefined && phone !== null ? { phone } : {}),
    ...(passwordHash !== undefined && passwordHash !== null
      ? { password_hash: passwordHash }
      : {}),
    ...(provider ? { provider } : {}),
    ...(googleEmail !== undefined && googleEmail !== null
      ? { google_email: googleEmail }
      : {}),
    ...(countryCode !== undefined && countryCode !== null
      ? { country_code: countryCode }
      : {}),
    ...(region !== undefined && region !== null ? { region } : {}),
    ...(age !== undefined && age !== null ? { age } : {}),
    ...(purpose !== undefined && purpose !== null ? { purpose } : {}),
    ...(gender !== undefined && gender !== null ? { gender } : {}),
    ...(diamonds !== undefined ? { diamonds } : {}),
    ...(onboardingCompleted !== undefined
      ? { onboarding_completed: Boolean(onboardingCompleted) }
      : {}),
  };

  try {
    // Attempt 1: Include `username` column directly if we have a username
    const payloadWithUsername = cleanUsername
      ? { ...basePayload, username: cleanUsername }
      : basePayload;

    const { data, error } = await client
      .from("profiles")
      .upsert(payloadWithUsername, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (!error) {
      return { ok: true, data };
    }

    // Attempt 2: Handle missing optional columns in Supabase (`username` or `avatar_url`)
    const fallbackPayload = { ...payloadWithUsername };
    if (/avatar_url/i.test(error.message || "")) {
      delete fallbackPayload.avatar_url;
    }
    if (cleanUsername && /username/i.test(error.message || "")) {
      delete fallbackPayload.username;
      fallbackPayload.region = `@${cleanUsername}`;
    }

    const retry = await client
      .from("profiles")
      .upsert(fallbackPayload, { onConflict: "id" })
      .select()
      .maybeSingle();
    if (!retry.error) {
      return { ok: true, data: retry.data };
    }
    return { ok: false, error: retry.error.message };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Records or updates an email that signed in through Google. */
async function saveGoogleAccount({ email, name = null, userId = null }) {
  if (!client) return { ok: false, skipped: true, error: reason };
  const validUserId = userId && UUID_RE.test(String(userId)) ? userId : null;
  try {
    const { data, error } = await client
      .from("google_accounts")
      .upsert(
        { email, name, user_id: validUserId },
        { onConflict: "email" }
      )
      .select()
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Stores the onboarding questionnaire answers. */
async function saveOnboarding({ userId, age, countryCode, purpose, gender }) {
  if (!client) return { ok: false, skipped: true, error: reason };
  if (!userId || !UUID_RE.test(String(userId))) {
    return { ok: false, error: "Invalid UUID for onboarding user_id" };
  }
  const safeAge =
    typeof age === "number" && Number.isFinite(age) && age >= 5 && age <= 120
      ? Math.round(age)
      : null;
  return insertRow("onboarding_answers", {
    user_id: userId,
    age: safeAge,
    country_code: countryCode,
    purpose,
    gender,
  });
}

/** Deletes a profile and associated records from Supabase. */
async function deleteProfile(userId) {
  if (!client || !userId) return { ok: false, skipped: true };
  try {
    await client.from("onboarding_answers").delete().eq("user_id", userId);
    await client.from("google_accounts").delete().eq("user_id", userId);
    const { error } = await client.from("profiles").delete().eq("id", userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Saves a message to the Supabase messages table. */
async function saveMessage({ userId, name, username, text, isAdmin = false }) {
  if (!client) return { ok: false, skipped: true, error: reason };
  try {
    const { data, error } = await client.from("messages").insert({
      user_id: userId,
      name: name || null,
      username: username || null,
      text: text,
      is_admin: isAdmin,
      created_at: new Date().toISOString(),
    }).select().maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function getMessages(userId) {
  if (!client || !userId) return [];
  try {
    const { data, error } = await client
      .from("messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

module.exports = {
  isSupabaseEnabled,
  getSupabase,
  supabaseStatus,
  insertRow,
  findRow,
  updateRow,
  saveProfile,
  saveGoogleAccount,
  saveOnboarding,
  extractProfileUsername,
  isUsernameTakenInSupabase,
  deleteProfile,
  saveMessage,
  getMessages,
};
