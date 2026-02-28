const { callPredictService, getModelInfo, checkMLHealth } = require("../utils/callPython");
const History = require("../models/History");
const User    = require("../models/User");

// Auto-detect article category from text
function detectCategory(text) {
  const t = text.toLowerCase();
  if (/breaking|shocking|exposed|bombshell|censored|sheeple|deep state|globalist|cabal/i.test(t))
    return "sensationalist";
  if (/doctors warn|health alert|heart failure|cancer|vaccine|medical|hospital|symptom|disease|diet|eating/i.test(t))
    return "medical";
  if (/home remedy|natural cure|colloidal|baking soda|essential oil|big pharma hiding|miracle cure/i.test(t))
    return "pseudoscience";
  if (/election|government|president|congress|senate|democrat|republican|political|vote|parliament/i.test(t))
    return "political";
  if (/stock|economy|gdp|inflation|interest rate|federal reserve|unemployment|market|trade/i.test(t))
    return "economic";
  if (/research|study|published|journal|scientist|climate|space|nasa|physics|biology/i.test(t))
    return "science";
  return "unknown";
}

// POST /api/predict
const predict = async (req, res) => {
  const { text, source = "text", sourceUrl } = req.body;
  if (!text || text.trim().length < 20)
    return res.status(400).json({ error: "Text must be at least 20 characters." });

  let mlResult;
  try {
    mlResult = await callPredictService(text.trim());
  } catch (err) {
    if (err.code === "ECONNREFUSED")
      return res.status(503).json({ error: "ML service unavailable. Start predict_service.py on port 5001." });
    return res.status(500).json({ error: "Prediction failed: " + err.message });
  }

  const category = detectCategory(text);

  const history = await History.create({
    user:               req.user._id,
    text:               text.trim(),
    verdict:            mlResult.verdict,
    confidence:         mlResult.confidence,
    probabilities:      mlResult.probabilities,
    mlProbabilities:    mlResult.ml_probabilities,
    ruleScore:          mlResult.rule_score,
    suspiciousKeywords: mlResult.suspicious_keywords || [],
    wordImportance:     mlResult.word_importance     || [],
    category,
    source,
    sourceUrl,
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { totalChecks: 1 } });

  res.status(200).json({
    historyId:          history._id,
    verdict:            mlResult.verdict,
    confidence:         mlResult.confidence,
    probabilities:      mlResult.probabilities,
    mlProbabilities:    mlResult.ml_probabilities,
    ruleScore:          mlResult.rule_score,
    suspiciousKeywords: mlResult.suspicious_keywords || [],
    wordImportance:     mlResult.word_importance     || [],
    category,
    textSnippet:        history.textSnippet,
    checkedAt:          history.createdAt,
  });
};

const modelInfo = async (req, res) => {
  try { res.json(await getModelInfo()); }
  catch { res.status(503).json({ error: "ML service unavailable" }); }
};

const mlHealth = async (req, res) => {
  const ok = await checkMLHealth();
  res.status(ok ? 200 : 503).json({ ml_service: ok ? "online" : "offline" });
};

module.exports = { predict, modelInfo, mlHealth };