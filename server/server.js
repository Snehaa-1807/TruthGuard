/**
 * TruthGuard - Node.js Express Server
 */

const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");
const dotenv     = require("dotenv");
const connectDB  = require("./config/db");
const { startKeepAlive } = require("./utils/keepAlive");

dotenv.config();

const authRoutes    = require("./routes/authRoutes");
const predictRoutes = require("./routes/predictRoutes");
const historyRoutes = require("./routes/historyRoutes");

const app = express();

// ── Connect Database ──────────────────────────────────────────────────────────
connectDB();

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet());

// CORS — allow any localhost port in development, specific URL in production
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (process.env.NODE_ENV !== "production") {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
    }

    const allowed = process.env.CLIENT_URL || "http://localhost:3000";
    if (origin === allowed) return callback(null, true);

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const predictLimiter = rateLimit({
  windowMs: 60 * 4000,
  max: 10,
  message: { error: "Prediction rate limit exceeded. Max 10/minute." },
});

app.use(globalLimiter);

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logger ────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status:    "ok",
    service:   "TruthGuard API",
    version:   "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/predict", predictLimiter, predictRoutes);
app.use("/api/history", historyRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 TruthGuard API running on http://localhost:${PORT}`);
  console.log(`🌍 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS        : ${ process.env.NODE_ENV !== "production" ? "all localhost ports" : process.env.CLIENT_URL}\n`);
  startKeepAlive();
});

module.exports = app;