const jwt  = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { username, email, password } = req.body;

  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) {
    const field = exists.email === email ? "Email" : "Username";
    return res.status(409).json({ error: `${field} already in use.` });
  }

  const user  = await User.create({ username, email, password });
  const token = signToken(user._id);

  res.status(201).json({
    message: "Account created successfully",
    token,
    user: user.toPublicJSON(),
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: email }],
  }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = signToken(user._id);

  res.json({
    message: "Login successful",
    token,
    user: user.toPublicJSON(),
  });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
};

module.exports = { register, login, getMe };
