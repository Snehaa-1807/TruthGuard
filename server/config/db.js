const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("\n🔧 Fix options:");
    console.error("   1. Atlas IP Whitelist → go to Atlas → Network Access → Add IP → Allow Access From Anywhere (0.0.0.0/0)");
    console.error("   2. Or use local MongoDB → set MONGO_URI=mongodb://localhost:27017/truthguard");
    console.error("   3. Check your MONGO_URI in server/.env is correct\n");
    process.exit(1);
  }
};

module.exports = connectDB;