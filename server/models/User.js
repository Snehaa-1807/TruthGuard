const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type:      String,
      required:  [true, "Username is required"],
      unique:    true,
      trim:      true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be at most 30 characters"],
      match:     [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, underscores"],
    },
    email: {
      type:     String,
      required: [true, "Email is required"],
      unique:   true,
      trim:     true,
      lowercase: true,
      match:    [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type:      String,
      required:  [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select:    false, // never return password in queries by default
    },
    role: {
      type:    String,
      enum:    ["user", "admin"],
      default: "user",
    },
    totalChecks: {
      type:    Number,
      default: 0,
    },
    lastActive: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Hash password before save ─────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt   = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare password ────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ── Instance method: safe public profile ─────────────────────────────────────
userSchema.methods.toPublicJSON = function () {
  return {
    id:          this._id,
    username:    this.username,
    email:       this.email,
    role:        this.role,
    totalChecks: this.totalChecks,
    createdAt:   this.createdAt,
  };
};

module.exports = mongoose.model("User", userSchema);
