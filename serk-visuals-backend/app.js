const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: require('path').join(__dirname, './config/.env') }); // Load environment variables from .env file
const myDatabaseMongoServer = require("./config/database");

// Import routes
const bookingRoutes = require("./routes/booking_routes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // move before routes

// Connect to the database
myDatabaseMongoServer();

// Routes 
app.use("/api/bookings", bookingRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
