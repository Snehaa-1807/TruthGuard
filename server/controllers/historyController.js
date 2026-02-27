const History = require("../models/History");

// GET /api/history  (paginated, filterable)
const getHistory = async (req, res) => {
  const page    = Math.max(1, parseInt(req.query.page)  || 1);
  const limit   = Math.min(50, parseInt(req.query.limit) || 10);
  const skip    = (page - 1) * limit;
  const verdict = req.query.verdict; // "FAKE" | "REAL" | undefined
  const search  = req.query.search;

  const filter = { user: req.user._id };
  if (verdict && ["FAKE", "REAL"].includes(verdict.toUpperCase())) {
    filter.verdict = verdict.toUpperCase();
  }
  if (search) {
    filter.textSnippet = { $regex: search, $options: "i" };
  }

  const [items, total] = await Promise.all([
    History.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-text -wordImportance"),
    History.countDocuments(filter),
  ]);

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

// GET /api/history/:id
const getHistoryItem = async (req, res) => {
  const item = await History.findOne({
    _id:  req.params.id,
    user: req.user._id,
  });

  if (!item) {
    return res.status(404).json({ error: "History item not found." });
  }

  res.json(item);
};

// DELETE /api/history/:id
const deleteHistoryItem = async (req, res) => {
  const item = await History.findOneAndDelete({
    _id:  req.params.id,
    user: req.user._id,
  });

  if (!item) {
    return res.status(404).json({ error: "History item not found." });
  }

  res.json({ message: "Deleted successfully." });
};

// DELETE /api/history  (clear all for user)
const clearHistory = async (req, res) => {
  const result = await History.deleteMany({ user: req.user._id });
  res.json({ message: `Deleted ${result.deletedCount} records.` });
};

// GET /api/history/stats
const getStats = async (req, res) => {
  const userId = req.user._id;

  const [totals, recent] = await Promise.all([
    History.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id:         "$verdict",
          count:       { $sum: 1 },
          avgConf:     { $avg: "$confidence" },
        },
      },
    ]),
    History.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("textSnippet verdict confidence createdAt"),
  ]);

  const fake = totals.find(t => t._id === "FAKE") || { count: 0, avgConf: 0 };
  const real = totals.find(t => t._id === "REAL") || { count: 0, avgConf: 0 };
  const total = fake.count + real.count;

  res.json({
    total,
    fakeCount:       fake.count,
    realCount:       real.count,
    fakePercent:     total ? Math.round((fake.count / total) * 100) : 0,
    avgConfidence:   total ? +((fake.avgConf * fake.count + real.avgConf * real.count) / total).toFixed(4) : 0,
    recentActivity:  recent,
  });
};

module.exports = { getHistory, getHistoryItem, deleteHistoryItem, clearHistory, getStats };
