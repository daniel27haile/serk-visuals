// config/database.js
const mongoose = require("mongoose");

async function connectMongo() {
  const uri =
    process.env.DATABASE_URL ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI;

  if (!uri) {
    throw new Error(
      "No MongoDB URI found. Set DATABASE_URL or MONGODB_URI or MONGO_URI in config/.env"
    );
  }

  // Optional: makes errors show immediately instead of buffering timeouts
  mongoose.set("bufferCommands", false);

  // Optional: extra logging while debugging
  mongoose.connection.on("connected", () =>
    console.log("🟢 Mongoose connected")
  );
  mongoose.connection.on("error", (err) =>
    console.log("🔴 Mongoose error:", err.message)
  );
  mongoose.connection.on("disconnected", () =>
    console.log("🟠 Mongoose disconnected")
  );

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  console.log(
    "✅ Database is successfully connected:",
    mongoose.connection.name
  );
  return mongoose.connection;
}

module.exports = connectMongo;
