/**
 * Pings the ML service every 10 minutes to prevent Render free tier sleep.
 */
const axios = require("axios");

const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";
const INTERVAL = 10 * 60 * 1000; // 10 minutes

function startKeepAlive() {
  if (process.env.NODE_ENV !== "production") return;

  console.log("🔔 Keep-alive started — pinging ML service every 10 minutes");

  setInterval(async () => {
    try {
      const res = await axios.get(`${ML_URL}/health`, { timeout: 10000 });
      console.log(`✅ ML ping OK — model_loaded: ${res.data.model_loaded}`);
    } catch (err) {
      console.warn("⚠ ML ping failed:", err.message);
    }
  }, INTERVAL);
}

module.exports = { startKeepAlive };