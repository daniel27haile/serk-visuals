require("dotenv").config({
  path: require("path").join(__dirname, "..", "config/.env"),
});
const mongoose = require("mongoose");
const argon2 = require("argon2");

(async () => {
  try {
    await require("../config/database")(); // your existing DB bootstrap
    const User = require("../models/user");

    const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password)
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD required");

    const passwordHash = await argon2.hash(password);
    const doc = await User.findOneAndUpdate(
      { email },
      { email, passwordHash, role: "admin" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ Admin upserted: ${doc.email}`);
  } catch (e) {
    console.error("Upsert admin failed:", e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
