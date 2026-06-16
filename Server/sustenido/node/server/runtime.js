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

function readNumberEnv(names, fallback) {
  const envNames = Array.isArray(names) ? names : [names];
  for (const name of envNames) {
    const raw = process.env[name];
    if (raw === undefined || raw === "") continue;

    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }

  return fallback;
}

function resolveNumber(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRequestPath(req) {
  const path = `${req.baseUrl || ""}${req.path || ""}`;
  return (path || req.originalUrl || req.url || "").split("?")[0];
}

function createJsonRateLimiter({ name, windowMs, max, message }) {
  if (!Number.isFinite(max) || max <= 0) {
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res, _next, options) => {
      const retryAfter = Number(res.getHeader("Retry-After"));
      const payload = {
        error: message,
        message,
        code: "RATE_LIMITED",
        limit: name,
      };

      if (Number.isFinite(retryAfter)) {
        payload.retryAfterSeconds = retryAfter;
      }

      res.status(options.statusCode).json(payload);
    },
  });
}

const GRANULAR_RATE_LIMIT_PATHS = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/signup",
  "/api/v1/auth/request-password-reset",
  "/api/v1/auth/reset-password",
  "/api/v1/createMusic",
  "/api/v1/scrape",
  "/api/v1/uploadProfileImage",
  "/api/v1/guitarpro/upload",
  "/api/v1/youtube/export",
]);

function createRuntime({
  defaultAllowedOrigins,
  apiRateLimitWindowMs,
  apiRateLimitMax,
} = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const defaultWindowMs = 15 * 60 * 1000;
  const rateLimitWindowMs = resolveNumber(
    apiRateLimitWindowMs,
    readNumberEnv("API_RATE_LIMIT_WINDOW_MS", defaultWindowMs),
  );
  const generalRateLimitMax = resolveNumber(
    apiRateLimitMax,
    readNumberEnv(
      ["API_GENERAL_RATE_LIMIT_MAX", "API_RATE_LIMIT_MAX"],
      isProduction ? 1000 : 5000,
    ),
  );
  const authLoginRateLimitMax = readNumberEnv(
    "API_AUTH_LOGIN_RATE_LIMIT_MAX",
    isProduction ? 30 : 120,
  );
  const authSensitiveRateLimitMax = readNumberEnv(
    "API_AUTH_SENSITIVE_RATE_LIMIT_MAX",
    isProduction ? 20 : 120,
  );
  const expensiveRateLimitMax = readNumberEnv(
    "API_EXPENSIVE_RATE_LIMIT_MAX",
    isProduction ? 120 : 500,
  );
  const uploadRateLimitMax = readNumberEnv(
    "API_UPLOAD_RATE_LIMIT_MAX",
    isProduction ? 60 : 200,
  );
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

  const apiLimiter = createJsonRateLimiter({
    name: "api-general",
    windowMs: rateLimitWindowMs,
    max: generalRateLimitMax,
    message: "Muitas requisicoes na API. Aguarde alguns minutos e tente novamente.",
  });

  const authLoginLimiter = createJsonRateLimiter({
    name: "auth-login",
    windowMs: rateLimitWindowMs,
    max: authLoginRateLimitMax,
    message: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
  });

  const authSensitiveLimiter = createJsonRateLimiter({
    name: "auth-sensitive",
    windowMs: rateLimitWindowMs,
    max: authSensitiveRateLimitMax,
    message: "Muitas tentativas de autenticacao. Aguarde alguns minutos e tente novamente.",
  });

  const expensiveLimiter = createJsonRateLimiter({
    name: "api-expensive",
    windowMs: rateLimitWindowMs,
    max: expensiveRateLimitMax,
    message: "Muitas acoes pesadas em pouco tempo. Aguarde alguns minutos e tente novamente.",
  });

  const uploadLimiter = createJsonRateLimiter({
    name: "api-upload",
    windowMs: rateLimitWindowMs,
    max: uploadRateLimitMax,
    message: "Muitos uploads em pouco tempo. Aguarde alguns minutos e tente novamente.",
  });

  function apiVersionCompatibility(req, _res, next) {
    if (req.url === "/api") {
      console.warn(JSON.stringify({
        event: "legacy_api_call",
        method: req.method,
        path: req.originalUrl || req.url,
        removalTarget: "2026-07-09",
      }));
      req.url = "/api/v1";
    } else if (req.url.startsWith("/api/") && !req.url.startsWith("/api/v1/")) {
      console.warn(JSON.stringify({
        event: "legacy_api_call",
        method: req.method,
        path: req.originalUrl || req.url,
        removalTarget: "2026-07-09",
      }));
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
    app.use("/api/v1/auth/login", authLoginLimiter);
    app.use("/api/v1/auth/signup", authSensitiveLimiter);
    app.use("/api/v1/auth/request-password-reset", authSensitiveLimiter);
    app.use("/api/v1/auth/reset-password", authSensitiveLimiter);
    app.use("/api/v1/createMusic", expensiveLimiter);
    app.use("/api/v1/scrape", expensiveLimiter);
    app.use("/api/v1/youtube/export", expensiveLimiter);
    app.use("/api/v1/uploadProfileImage", uploadLimiter);
    app.use("/api/v1/guitarpro/upload", uploadLimiter);
    app.use("/api", (req, res, next) => {
      if (GRANULAR_RATE_LIMIT_PATHS.has(getRequestPath(req))) {
        return next();
      }

      return apiLimiter(req, res, next);
    });
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
