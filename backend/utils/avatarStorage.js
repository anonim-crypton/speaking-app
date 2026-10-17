const fs = require("fs");
const path = require("path");

const MEDIA_DIR = path.join(__dirname, "..", "media");
const AVATARS_DIR = path.join(MEDIA_DIR, "avatars");

function ensureAvatarsDir() {
  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
  }
}

/**
 * Saves a base64/dataURL image into backend/media/avatars/avatar_<userId>_<time>.<ext>
 * Returns { relativeUrl: "/media/avatars/...", filename, filePath }
 */
function saveAvatarFile(userId, imageString) {
  if (!imageString || typeof imageString !== "string") return null;
  const trimmed = imageString.trim();
  if (!trimmed) return null;

  ensureAvatarsDir();

  let mimeSubtype = "jpeg";
  let ext = "jpg";
  let base64Payload = trimmed;

  const matches = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (matches) {
    mimeSubtype = matches[1].toLowerCase();
    ext = mimeSubtype === "jpeg" ? "jpg" : mimeSubtype === "svg+xml" ? "svg" : mimeSubtype;
    base64Payload = matches[2];
  }

  let buffer;
  try {
    buffer = Buffer.from(base64Payload, "base64");
  } catch (err) {
    console.warn("Failed to decode base64 avatar:", err.message);
    return null;
  }

  if (!buffer || buffer.length === 0) return null;

  const safeUserId = String(userId || "guest").replace(/[^a-zA-Z0-9_-]/g, "");
  const filename = `avatar_${safeUserId}_${Date.now()}.${ext}`;
  const filePath = path.join(AVATARS_DIR, filename);

  try {
    fs.writeFileSync(filePath, buffer);
    return {
      relativeUrl: `/media/avatars/${filename}`,
      filename,
      filePath,
      dataUrl: `data:image/${mimeSubtype};base64,${base64Payload}`,
    };
  } catch (err) {
    console.error("Failed to write avatar file:", err);
    return null;
  }
}

module.exports = {
  AVATARS_DIR,
  ensureAvatarsDir,
  saveAvatarFile,
};
