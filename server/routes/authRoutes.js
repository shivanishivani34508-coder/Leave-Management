const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  resetPassword,
} = require("../controllers/authController");

// =========================================================
// REGISTER
// =========================================================

router.post("/register", registerUser);

// =========================================================
// LOGIN
// =========================================================

router.post("/login", loginUser);

// =========================================================
// RESET PASSWORD
// =========================================================

router.post("/reset-password", resetPassword);

module.exports = router;