const mongoose = require("mongoose");

const wordImportanceSchema = new mongoose.Schema({
  word:  { type: String },
  score: { type: Number },
}, { _id: false });

const historySchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    text: {
      type:     String,
      required: true,
      maxlength: 50_000,
    },
    textSnippet: {
      type:   String,
      maxlength: 120,
    },
    verdict: {
      type:     String,
      enum:     ["FAKE", "REAL"],
      required: true,
      index:    true,
    },
    confidence: {
      type:    Number,
      min:     0,
      max:     1,
      required: true,
    },
    probabilities: {
      FAKE: { type: Number },
      REAL: { type: Number },
    },
    suspiciousKeywords: [{ type: String }],
    wordImportance:     [wordImportanceSchema],
    reasoning:          { type: String },
    credibilityFactors: [{ type: String }],
    sentimentScore:     { type: Number, min: -1, max: 1 },
    source: {
      type:    String,
      enum:    ["text", "url"],
      default: "text",
    },
    sourceUrl: { type: String },
  },
  { timestamps: true }
);

// Auto-generate snippet before save
historySchema.pre("save", function (next) {
  if (this.text && !this.textSnippet) {
    this.textSnippet = this.text.slice(0, 117) + (this.text.length > 117 ? "..." : "");
  }
  next();
});

// Compound index for fast user history queries
historySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("History", historySchema);
