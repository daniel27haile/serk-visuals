// middleware/auth.js
const jwt = require("jsonwebtoken");

const COOKIE_NAME = "token";

function signToken(payload, expiresIn = "7d") {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me";
  return jwt.verify(token, secret);
}

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Unauthenticated" });
  try {
    const data = verifyToken(token);
    req.user = data;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(roles = ["admin"]) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

// Convenience combo for admin-only routes
// Express accepts arrays of middleware.
const requireAdmin = [requireAuth, requireRole(["admin"])];

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    // SameSite=None is required for cross-origin credentialed requests
    // (frontend: serkvisuals.com → API: serk-visuals-api.onrender.com).
    // SameSite=None mandates Secure=true, enforced in prod.
    // No domain attribute — cookie is scoped to the API’s own domain so the
    // browser sends it on credentialed cross-origin requests.
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookie(res) {
  const isProd = process.env.NODE_ENV === "production";
  // Attributes must EXACTLY match setAuthCookie or the browser won’t delete it
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
  });
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin, // 👈 export this
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  COOKIE_NAME,
};
