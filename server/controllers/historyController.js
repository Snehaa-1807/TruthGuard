const History = require("../models/History");

// GET /api/history
const getHistory = async (req, res) => {
  const page      = Math.max(1, parseInt(req.query.page)  || 1);
  const limit     = Math.min(50, parseInt(req.query.limit) || 10);
  const skip      = (page - 1) * limit;
  const verdict   = req.query.verdict;
  const search    = req.query.search;
  const bookmarked= req.query.bookmarked;
  const category  = req.query.category;

  const filter = { user: req.user._id };
  if (verdict && ["FAKE","REAL"].includes(verdict.toUpperCase()))
    filter.verdict = verdict.toUpperCase();
  if (search)
    filter.textSnippet = { $regex: search, $options: "i" };
  if (bookmarked === "true")
    filter.bookmarked = true;
  if (category)
    filter.category = category;

  const [items, total] = await Promise.all([
    History.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
      .select("-text -wordImportance"),
    History.countDocuments(filter),
  ]);

  res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// GET /api/history/:id
const getHistoryItem = async (req, res) => {
  const item = await History.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) return res.status(404).json({ error: "Not found." });
  res.json(item);
};

// DELETE /api/history/:id
const deleteHistoryItem = async (req, res) => {
  const item = await History.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) return res.status(404).json({ error: "Not found." });
  res.json({ message: "Deleted." });
};

// DELETE /api/history
const clearHistory = async (req, res) => {
  const result = await History.deleteMany({ user: req.user._id });
  res.json({ message: `Deleted ${result.deletedCount} records.` });
};

// PATCH /api/history/:id/bookmark  — toggle bookmark
const toggleBookmark = async (req, res) => {
  const item = await History.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) return res.status(404).json({ error: "Not found." });
  item.bookmarked = !item.bookmarked;
  await item.save();
  res.json({ bookmarked: item.bookmarked });
};

// PATCH /api/history/:id/note  — save user note
const saveNote = async (req, res) => {
  const { note } = req.body;
  const item = await History.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { userNote: (note || "").slice(0, 500) },
    { new: true }
  );
  if (!item) return res.status(404).json({ error: "Not found." });
  res.json({ userNote: item.userNote });
};

// GET /api/history/stats  — rich analytics
const getStats = async (req, res) => {
  const userId = req.user._id;

  const [totals, recent, byCategory, trend] = await Promise.all([
    History.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$verdict", count: { $sum: 1 }, avgConf: { $avg: "$confidence" } } },
    ]),
    History.find({ user: userId }).sort({ createdAt: -1 }).limit(5)
      .select("textSnippet verdict confidence createdAt category"),
    // Category breakdown
    History.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$category", total: { $sum: 1 },
          fakeCount: { $sum: { $cond: [{ $eq: ["$verdict","FAKE"] }, 1, 0] } } } },
      { $sort: { total: -1 } },
    ]),
    // Last 14 days trend
    History.aggregate([
      { $match: { user: userId, createdAt: { $gte: new Date(Date.now() - 14*24*60*60*1000) } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          fake:  { $sum: { $cond: [{ $eq: ["$verdict","FAKE"] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]),
  ]);

  const fake  = totals.find(t => t._id === "FAKE") || { count: 0, avgConf: 0 };
  const real  = totals.find(t => t._id === "REAL") || { count: 0, avgConf: 0 };
  const total = fake.count + real.count;
  const bookmarkedCount = await History.countDocuments({ user: userId, bookmarked: true });

  res.json({
    total,
    fakeCount:      fake.count,
    realCount:      real.count,
    fakePercent:    total ? Math.round((fake.count / total) * 100) : 0,
    avgConfidence:  total ? +((fake.avgConf * fake.count + real.avgConf * real.count) / total).toFixed(4) : 0,
    bookmarkedCount,
    recentActivity: recent,
    byCategory,
    trend,
  });
};

// GET /api/history/export  — CSV export
const exportHistory = async (req, res) => {
  const items = await History.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select("textSnippet verdict confidence category createdAt suspiciousKeywords userNote");

  const header = "Date,Verdict,Confidence,Category,Keywords,Note,Snippet\n";
  const rows   = items.map(i => {
    const date    = new Date(i.createdAt).toLocaleDateString();
    const conf    = Math.round(i.confidence * 100) + "%";
    const cat     = i.category || "";
    const keywords= (i.suspiciousKeywords || []).join("; ");
    const note    = (i.userNote || "").replace(/"/g, '""');
    const snippet = (i.textSnippet || "").replace(/"/g, '""');
    return `"${date}","${i.verdict}","${conf}","${cat}","${keywords}","${note}","${snippet}"`;
  }).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=truthguard-history.csv");
  res.send(header + rows);
};

module.exports = { getHistory, getHistoryItem, deleteHistoryItem, clearHistory,
                   toggleBookmark, saveNote, getStats, exportHistory };