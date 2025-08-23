const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config({ path: require('path').join(__dirname, './config/.env') }); // Load environment variables from .env file
const myDatabaseMongoServer = require("./config/database");

// Import routes
const bookingRoutes = require("./routes/booking_routes");
const galleryRoutes = require("./routes/gallery_routes"); 
const contactUsRoutes = require("./routes/contactus_routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // move before routes
app.use(helmet());

// Connect to the database
myDatabaseMongoServer();

// Routes 
app.use("/api/bookings", bookingRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/contact", contactUsRoutes);

// Error handling middleware
// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
