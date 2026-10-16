const express = require("express");

const router = express.Router();

/* Region → the only country that registers with a phone number (OTP). */
const PHONE_REGIONS = new Set(["UZ"]);

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 h
const cache = new Map();

function isPrivateIp(ip) {
  if (!ip) return true;
  const value = ip.replace(/^::ffff:/, "");
  return (
    value === "::1" ||
    value === "127.0.0.1" ||
    value.startsWith("10.") ||
    value.startsWith("192.168.") ||
    value.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(value) ||
    value.startsWith("fc") ||
    value.startsWith("fd")
  );
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim();
  }
  return (req.ip || "").replace(/^::ffff:/, "");
}

/**
 * GET /api/geo
 * Best-effort country lookup for the caller: CDN header first, then a cached
 * IP lookup. Always answers 200 — `country: null` simply means "unknown, let
 * the browser decide".
 */
router.get("/", async (req, res) => {
  /* 1 ─ Cloudflare / hosting proxy header (no network call needed). */
  const headerCountry = req.headers["cf-ipcountry"] || req.headers["x-country-code"];
  if (typeof headerCountry === "string" && /^[A-Z]{2}$/.test(headerCountry) && headerCountry !== "XX") {
    return res.json({
      success: true,
      country: headerCountry,
      region: headerCountry,
      phoneOnly: PHONE_REGIONS.has(headerCountry),
      source: "header",
    });
  }

  const ip = clientIp(req);
  if (isPrivateIp(ip)) {
    /* localhost / LAN — the browser's own time-zone detection takes over. */
    return res.json({
      success: true,
      country: null,
      region: null,
      phoneOnly: false,
      source: "private-ip",
    });
  }

  const cached = cache.get(ip);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return res.json({
      success: true,
      country: cached.country,
      region: cached.country,
      phoneOnly: PHONE_REGIONS.has(cached.country),
      source: "cache",
    });
  }

  /* 2 ─ Free, key-less IP lookup with a hard timeout. */
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    const data = await response.json();
    const country = data && data.status === "success" ? data.countryCode : null;
    if (country) cache.set(ip, { country, at: Date.now() });
    return res.json({
      success: true,
      country,
      region: country,
      phoneOnly: PHONE_REGIONS.has(country),
      source: "ip",
    });
  } catch {
    return res.json({
      success: true,
      country: null,
      region: null,
      phoneOnly: false,
      source: "unavailable",
    });
  }
});

module.exports = router;
module.exports.PHONE_REGIONS = PHONE_REGIONS;
