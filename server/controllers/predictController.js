const { validationResult } = require("express-validator");
const { callPredictService, getModelInfo, checkMLHealth } = require("../utils/callPython");
const History = require("../models/History");
const User    = require("../models/User");

// POST /api/predict
const predict = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { text, source = "text", sourceUrl } = req.body;

  // Call Python ML microservice
  let mlResult;
  try {
    mlResult = await callPredictService(text);
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND") {
      return res.status(503).json({
        error: "ML service unavailable. Ensure predict_service.py is running.",
      });
    }
    return res.status(500).json({ error: "Prediction failed: " + err.message });
  }

  // Save to history
  const history = await History.create({
    user:               req.user._id,
    text,
    verdict:            mlResult.verdict,
    confidence:         mlResult.confidence,
    probabilities:      mlResult.probabilities,
    suspiciousKeywords: mlResult.suspicious_keywords || [],
    wordImportance:     mlResult.word_importance     || [],
    source,
    sourceUrl,
  });

  // Increment user check count
  await User.findByIdAndUpdate(req.user._id, { $inc: { totalChecks: 1 } });

  res.status(200).json({
    historyId:          history._id,
    verdict:            mlResult.verdict,
    confidence:         mlResult.confidence,
    probabilities:      mlResult.probabilities,
    suspiciousKeywords: mlResult.suspicious_keywords || [],
    wordImportance:     mlResult.word_importance     || [],
    textSnippet:        history.textSnippet,
    checkedAt:          history.createdAt,
  });
};

// GET /api/predict/model-info
const modelInfo = async (req, res) => {
  try {
    const info = await getModelInfo();
    res.json(info);
  } catch {
    const healthy = await checkMLHealth();
    res.status(healthy ? 500 : 503).json({
      error: healthy ? "Failed to fetch model info" : "ML service unavailable",
    });
  }
};

// GET /api/predict/health
const mlHealth = async (req, res) => {
  const ok = await checkMLHealth();
  res.status(ok ? 200 : 503).json({ ml_service: ok ? "online" : "offline" });
};

module.exports = { predict, modelInfo, mlHealth };
