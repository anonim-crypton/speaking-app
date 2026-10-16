const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || "speaking-talk-secret-key-change-me";

/**
 * Public, unguessable URL segment for a user's home page (/u/<slug>).
 * Derived from the user id with an HMAC, so it is unique per user, stable
 * across logins, never reveals the real id and needs no extra database column.
 */
function userSlug(id) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(String(id))
    .digest("base64url")
    .slice(0, 32);
}

module.exports = { userSlug };
