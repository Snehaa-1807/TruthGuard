const express = require("express");
const { getHistory, getHistoryItem, deleteHistoryItem, clearHistory,
        toggleBookmark, saveNote, getStats, exportHistory } = require("../controllers/historyController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(protect);

router.get("/",              getHistory);
router.get("/stats",         getStats);
router.get("/export",        exportHistory);
router.get("/:id",           getHistoryItem);
router.delete("/",           clearHistory);
router.delete("/:id",        deleteHistoryItem);
router.patch("/:id/bookmark",toggleBookmark);
router.patch("/:id/note",    saveNote);

module.exports = router;