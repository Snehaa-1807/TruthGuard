const express  = require("express");
const { body } = require("express-validator");
const { predict, modelInfo, mlHealth } = require("../controllers/predictController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  [
    body("text")
      .trim()
      .isLength({ min: 20 })
      .withMessage("Text must be at least 20 characters")
      .isLength({ max: 50_000 })
      .withMessage("Text too long (max 50,000 chars)"),
  ],
  predict
);

router.get("/model-info", protect, modelInfo);
router.get("/health",     mlHealth);

module.exports = router;
