// app.js (or server.js)
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: path.join(__dirname, "./config/.env") });

const connectMongo = require("./config/database");
const bookingRoutes = require("./routes/booking_routes");
const galleryRoutes = require("./routes/gallery_routes");
const contactUsRoutes = require("./routes/contactus_routes");
const authRoutes = require("./routes/auth_routes");

const app = express();
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:4200";
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "30d",
    immutable: true,
  })
);

// Routes can be mounted before DB connects
app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/contact", contactUsRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const isZod = err?.name === "ZodError";
  if (isZod)
    return res
      .status(400)
      .json({ error: "Invalid input", details: err.errors });
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3500;

// ✅ Await DB connect before seeding + listen
(async () => {
  try {
    await connectMongo();

    // optional: seed/upsert admin
    const User = require("./models/user");
    const argon2 = require("argon2");
    const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    if (email && password) {
      const exists = await User.findOne({ email });
      if (!exists) {
        const passwordHash = await argon2.hash(password);
        await User.create({ email, passwordHash, role: "admin" });
        console.log(`✅ Seeded admin: ${email}`);
      } else {
        console.log(`ℹ️ Admin exists: ${email}`);
      }
    } else {
      console.log(
        "ℹ️ Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to auto-seed an admin"
      );
    }

    app.listen(PORT, () =>
      console.log(`✅ API running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
