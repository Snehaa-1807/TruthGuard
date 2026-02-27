const express = require("express");
const {
  getHistory, getHistoryItem,
  deleteHistoryItem, clearHistory, getStats,
} = require("../controllers/historyController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // all history routes require auth

router.get("/",        getHistory);
router.get("/stats",   getStats);
router.get("/:id",     getHistoryItem);
router.delete("/",     clearHistory);
router.delete("/:id",  deleteHistoryItem);

module.exports = router;
