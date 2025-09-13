// controller/auth_controller.js
const argon2 = require("argon2");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} = require("../middleware/auth");

async function verifyPassword(storedHash, plain) {
  // Detect by prefix to avoid wasted work
  if (typeof storedHash === "string" && storedHash.startsWith("$2")) {
    // bcrypt
    return bcrypt.compare(String(plain), storedHash);
  }
  // default to argon2
  try {
    return await argon2.verify(storedHash, String(plain));
  } catch {
    return false;
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
  });
  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  const token = signToken({
    sub: user._id,
    email: user.email,
    role: user.role,
  });
  setAuthCookie(res, token);
  res.json({ user: { id: user._id, email: user.email, role: user.role } });
};

exports.logout = async (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
};

exports.me = async (req, res) => {
  if (!req.cookies?.token) return res.json({ user: null });
  try {
    const { verifyToken } = require("../middleware/auth");
    const { sub, email, role } = verifyToken(req.cookies.token);
    res.json({ user: { id: sub, email, role } });
  } catch {
    res.json({ user: null });
  }
};
