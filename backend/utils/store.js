const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf8");
}

function readUsers() {
  try {
    const raw = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    if (!Array.isArray(raw)) return [];
    let mutated = false;
    const normalized = raw.map((u) => {
      if (!u || typeof u !== "object") return u;
      if (!u.id || !UUID_RE.test(String(u.id))) {
        mutated = true;
        return { ...u, id: crypto.randomUUID() };
      }
      return u;
    });
    if (mutated) {
      writeUsers(normalized);
    }
    return normalized;
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

const norm = (v) => String(v ?? "").trim().toLowerCase();
const normUsername = (v) =>
  String(v ?? "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

/** Digits-only form so "+998 90 123 45 67" and "998901234567" match. */
const digits = (v) => String(v ?? "").replace(/\D/g, "");

function findByEmail(email) {
  if (!email) return undefined;
  const target = norm(email);
  return readUsers().find((u) => u.email && norm(u.email) === target);
}

function findByPhone(phone) {
  if (!phone) return undefined;
  const target = digits(phone);
  if (!target) return undefined;
  return readUsers().find((u) => u.phone && digits(u.phone) === target);
}

function findByUsername(username, excludeUserId = null) {
  if (!username) return undefined;
  const target = normUsername(username);
  if (!target) return undefined;
  return readUsers().find(
    (u) =>
      u.id !== excludeUserId &&
      u.username &&
      normUsername(u.username) === target
  );
}

function findById(id) {
  return readUsers().find((u) => u.id === id);
}

function createUser({
  id = null,
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
  diamonds = 0,
  onboardingCompleted = false,
}) {
  const users = readUsers();
  const validId = id && UUID_RE.test(String(id)) ? id : crypto.randomUUID();
  const user = {
    id: validId,
    name: name ? String(name).trim() : null,
    username: username ? normUsername(username) : null,
    email: email ? norm(email) : null,
    phone: phone ? digits(phone) : null,
    passwordHash,
    provider,
    googleEmail: googleEmail ? norm(googleEmail) : null,
    countryCode,
    region,
    age,
    purpose,
    gender,
    diamonds: Number(diamonds) || 0,
    onboardingCompleted: Boolean(onboardingCompleted),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

function updateUser(id, patch) {
  const users = readUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  const nextPatch = { ...patch };
  if (nextPatch.username !== undefined && nextPatch.username !== null) {
    nextPatch.username = normUsername(nextPatch.username);
  }
  users[index] = {
    ...users[index],
    ...nextPatch,
    updatedAt: new Date().toISOString(),
  };
  writeUsers(users);
  return users[index];
}

module.exports = {
  readUsers,
  findByEmail,
  findByPhone,
  findByUsername,
  findById,
  createUser,
  updateUser,
  normUsername,
};
