const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config({
  path: require("path").join(__dirname, "./config/.env"),
});

const myDatabaseMongoServer = require("./config/database");

// Routers
const bookingRoutes = require("./routes/booking_routes");
const galleryRoutes = require("./routes/gallery_routes");
const contactUsRoutes = require("./routes/contactus_routes");

const app = express();

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// DB
myDatabaseMongoServer();

// Mount routes BEFORE 404
app.use("/api/bookings", bookingRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/contact", contactUsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// 500
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3500; // <- 3500 confirmed
app.listen(PORT, () =>
  console.log(`✅ API running at http://localhost:${PORT}`)
);
