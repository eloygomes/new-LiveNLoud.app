const cors = require("cors");
const express = require("express");
const rateLimit = require("express-rate-limit");

const LAN_DEV_ORIGIN_REGEX = /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/;
const CHROME_EXTENSION_ORIGIN_REGEX = /^chrome-extension:\/\/[a-p]{32}$/;
const FIREFOX_EXTENSION_ORIGIN_REGEX = /^moz-extension:\/\/[0-9a-f-]+$/i;

function parseCsvEnv(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createRuntime({
  defaultAllowedOrigins,
  apiRateLimitWindowMs = Number(
    process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  ),
  apiRateLimitMax = Number(process.env.API_RATE_LIMIT_MAX || 100),
} = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const configuredAllowedOrigins = parseCsvEnv(
    process.env.CORS_ALLOWED_ORIGINS,
  );
  const allowedOrigins = new Set([
    ...(defaultAllowedOrigins || []),
    ...configuredAllowedOrigins,
  ]);

  function isAllowedDevOrigin(origin) {
    return (
      origin === "http://127.0.0.1:5173" ||
      origin === "http://localhost:5173" ||
      LAN_DEV_ORIGIN_REGEX.test(origin)
    );
  }

  function isAllowedExtensionOrigin(origin) {
    return (
      CHROME_EXTENSION_ORIGIN_REGEX.test(origin) ||
      FIREFOX_EXTENSION_ORIGIN_REGEX.test(origin)
    );
  }

  function isAllowedOrigin(origin) {
    if (!origin) return true;
    if (allowedOrigins.has(origin)) return true;
    if (isAllowedExtensionOrigin(origin)) return true;
    if (!isProduction && isAllowedDevOrigin(origin)) return true;
    return false;
  }

  const corsMiddleware = cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  });

  const apiLimiter = rateLimit({
    windowMs: apiRateLimitWindowMs,
    max: apiRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });

  function apiVersionCompatibility(req, _res, next) {
    if (req.url === "/api") {
      req.url = "/api/v1";
    } else if (req.url.startsWith("/api/") && !req.url.startsWith("/api/v1/")) {
      req.url = `/api/v1/${req.url.slice("/api/".length)}`;
    }
    next();
  }

  function applyCoreMiddleware(app) {
    if (isProduction) {
      app.set("trust proxy", 1);
    }

    app.use(corsMiddleware);
    app.use(apiVersionCompatibility);
    app.use("/api", apiLimiter);
    app.use(express.json({ limit: "50mb" }));
  }

  return {
    applyCoreMiddleware,
    corsMiddleware,
    isAllowedOrigin,
  };
}

module.exports = {
  createRuntime,
};
