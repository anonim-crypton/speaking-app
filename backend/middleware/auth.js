const jwt = require("jsonwebtoken");
const store = require("../utils/store");
const sessionStore = require("../utils/sessionStore");

const JWT_SECRET = process.env.JWT_SECRET || "speaking-talk-secret-key-change-me";

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = store.findById(payload.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (payload.sid) {
      const session = sessionStore.getSession(payload.sid);
      if (!session || session.revoked) {
        return res.status(401).json({
          success: false,
          message: "Seans yakunlangan. Iltimos, qaytadan kiring.",
          code: "SESSION_TERMINATED",
        });
      }
      if (session.blocked) {
        return res.status(403).json({
          success: false,
          message: "Sizning qurilmangiz bu hisob tomonidan bloklangan.",
          code: "DEVICE_BLOCKED",
        });
      }
      sessionStore.touchSession(payload.sid, req.ip);
      req.sid = payload.sid;
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

module.exports = { authRequired, JWT_SECRET };
