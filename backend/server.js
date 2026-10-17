const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const geoRoutes = require("./routes/geo");
const onboardingRoutes = require("./routes/onboarding");
const presenceRoutes = require("./routes/presence");
const matchmakingRoutes = require("./routes/matchmaking");
const socialRoutes = require("./routes/social");
const clubsRoutes = require("./routes/clubs");
const adminRoutes = require("./routes/admin");
const supabase = require("./lib/supabase");

const app = express();
const PORT = process.env.PORT || 5000;

/* Needed so req.ip is the real client address behind a proxy/CDN. */
app.set("trust proxy", true);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow all origins (Vercel, localhost, custom domains) dynamically
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
const fs = require("fs");
const store = require("./utils/store");

// Re-create avatar from database/cache if missing on Render's ephemeral disk
app.get("/media/avatars/:filename", (req, res, next) => {
  const filePath = path.join(__dirname, "media", "avatars", req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  try {
    const match = req.params.filename.match(/^avatar_([^_]+)_/);
    const userId = match ? match[1] : null;
    if (userId) {
      const user = store.findById(userId);
      const dataUrl = user?.avatarDataUrl || (user?.avatarUrl?.startsWith("data:image/") ? user.avatarUrl : null);
      if (dataUrl) {
        const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (matches) {
          const buffer = Buffer.from(matches[2], "base64");
          fs.mkdirSync(path.join(__dirname, "media", "avatars"), { recursive: true });
          fs.writeFileSync(filePath, buffer);
          return res.sendFile(filePath);
        }
      }
    }
  } catch {
    /* ignore */
  }
  next();
});

app.use("/media", express.static(path.join(__dirname, "media")));
app.use(require("./utils/errorCodes").errorCodes);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/presence", presenceRoutes);
app.use("/api/matchmaking", matchmakingRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/clubs", clubsRoutes);
app.use("/api/admin", adminRoutes);

// Redirect /admin and /speak-admin on port 5000 directly to React Admin Panel on 5173
app.get("/admin", (req, res) => {
  res.redirect("http://localhost:5173/speak-admin");
});
app.get("/speak-admin", (req, res) => {
  res.redirect("http://localhost:5173/speak-admin");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Lingo Speek API",
    supabase: supabase.supabaseStatus(),
    time: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✅ Lingo Speek API running on http://localhost:${PORT}`);
  const status = supabase.supabaseStatus();
  if (status.enabled) {
    console.log("🗄️  Supabase: connected");
  } else {
    console.log(`⚠️  Supabase: disabled (${status.reason})`);
    console.log("    Accounts are still stored locally in backend/data/users.json");
  }
});
