const mongoose = require("mongoose");
// require("dotenv").config();              // not needed if you keep it in app.js

const myDatabaseMongoServer = () => {
  const uri =
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI || // support common names
    process.env.MONGO_URI;

  if (!uri) {
    console.error(
      "❌ No MongoDB URI found. Set DATABASE_URL or MONGODB_URI in .env"
    );
    return;
  }

  mongoose
    .connect(uri /* , { useNewUrlParser: true, useUnifiedTopology: true } */)
    .then(() => console.log("✅ Database is successfully connected..."))
    .catch((err) => {
      console.log("❌ Database is NOT connected...", err.message);
    });
};

module.exports = myDatabaseMongoServer;
