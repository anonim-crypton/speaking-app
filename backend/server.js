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
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
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

// Redirect /admin on port 5000 directly to React Admin Panel on 5173
app.get("/admin", (req, res) => {
  res.redirect("http://localhost:5173/admin");
});

// Proxy to Django Admin Backend
const DJANGO_PORT = process.env.DJANGO_PORT || 8000;
app.use("/api/admin", async (req, res) => {
  try {
    const targetUrl = `http://127.0.0.1:${DJANGO_PORT}/api/admin${req.url}`;
    const options = {
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${DJANGO_PORT}` },
    };
    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      options.headers["content-type"] = "application/json";
      options.body = JSON.stringify(req.body);
    }
    const response = await fetch(targetUrl, options);
    const data = await response.text();
    res.status(response.status);
    response.headers.forEach((val, key) => {
      if (!["transfer-encoding", "content-length"].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });
    res.send(data);
  } catch (err) {
    console.error("Django proxy error:", err.message);
    res.status(502).json({
      success: false,
      message: "Django admin server bilan aloqa o'rnatib bo'lmadi. Python server ishga tushirilganligini tekshiring.",
    });
  }
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
