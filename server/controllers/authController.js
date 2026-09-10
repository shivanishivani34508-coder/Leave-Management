const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* =========================================================
   HELPER - GENERATE JWT TOKEN
========================================================= */

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is missing from the .env file."
    );
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};

/* =========================================================
   REGISTER USER
========================================================= */

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    /* -------------------------------------------------------
       REQUIRED FIELD VALIDATION
    ------------------------------------------------------- */

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required.",
      });
    }

    /* -------------------------------------------------------
       PASSWORD VALIDATION
    ------------------------------------------------------- */

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    /* -------------------------------------------------------
       NORMALIZE EMAIL
    ------------------------------------------------------- */

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    /* -------------------------------------------------------
       CHECK EXISTING USER
    ------------------------------------------------------- */

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "User with this email already exists.",
      });
    }

    /* -------------------------------------------------------
       HASH PASSWORD
    ------------------------------------------------------- */

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );

    /* -------------------------------------------------------
       CREATE EMPLOYEE USER

       Public registration always creates an employee.

       Admin accounts should not be created through
       public registration.
    ------------------------------------------------------- */

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "employee",
    });

    /* -------------------------------------------------------
       GENERATE JWT TOKEN
    ------------------------------------------------------- */

    const token = generateToken(user);

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return res.status(201).json({
      message: "User registered successfully.",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        leaveBalances: user.leaveBalances,
      },
    });
  } catch (error) {
    console.error(
      "REGISTER USER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while registering user.",
    });
  }
};

/* =========================================================
   LOGIN USER
========================================================= */

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* -------------------------------------------------------
       REQUIRED FIELD VALIDATION
    ------------------------------------------------------- */

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message:
          "Email and password are required.",
      });
    }

    /* -------------------------------------------------------
       NORMALIZE EMAIL
    ------------------------------------------------------- */

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    /* -------------------------------------------------------
       FIND USER
    ------------------------------------------------------- */

    const user = await User.findOne({
      email: normalizedEmail,
    });

    console.log(
      "================================"
    );

    console.log(
      "LOGIN EMAIL:",
      normalizedEmail
    );

    if (!user) {
      console.log("❌ USER NOT FOUND");

      console.log(
        "================================"
      );

      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    console.log("✅ USER FOUND");
    console.log(
      "DATABASE EMAIL:",
      user.email
    );
    console.log(
      "DATABASE ROLE:",
      user.role
    );

    /* -------------------------------------------------------
       VERIFY PASSWORD
    ------------------------------------------------------- */

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    console.log(
      "PASSWORD MATCH:",
      isPasswordCorrect
    );

    console.log(
      "================================"
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    /* -------------------------------------------------------
       GENERATE JWT TOKEN
    ------------------------------------------------------- */

    const token = generateToken(user);

    /* -------------------------------------------------------
       RESPONSE

       Password is NEVER returned.

       leaveBalances are returned so the frontend
       receives the current leave-balance information.
    ------------------------------------------------------- */

    return res.status(200).json({
      message: "Login successful.",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        leaveBalances: user.leaveBalances,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN USER ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while logging in.",
    });
  }
};

/* =========================================================
   RESET PASSWORD
   WEBSITE-ONLY PASSWORD RESET

   User enters:
   - Registered email
   - New password

   No email link is required.
   No reset token is required.
========================================================= */

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    /* -------------------------------------------------------
       VALIDATE EMAIL
    ------------------------------------------------------- */

    if (!email?.trim()) {
      return res.status(400).json({
        message:
          "Email address is required.",
      });
    }

    /* -------------------------------------------------------
       VALIDATE PASSWORD
    ------------------------------------------------------- */

    if (!password) {
      return res.status(400).json({
        message:
          "New password is required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    /* -------------------------------------------------------
       NORMALIZE EMAIL
    ------------------------------------------------------- */

    const normalizedEmail = email
      .toLowerCase()
      .trim();

    /* -------------------------------------------------------
       FIND USER
    ------------------------------------------------------- */

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        message:
          "No account found with this email address.",
      });
    }

    /* -------------------------------------------------------
       HASH NEW PASSWORD
    ------------------------------------------------------- */

    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(
        password,
        salt
      );

    /* -------------------------------------------------------
       UPDATE PASSWORD
    ------------------------------------------------------- */

    user.password = hashedPassword;

    await user.save();

    console.log(
      "================================"
    );

    console.log(
      "PASSWORD RESET SUCCESSFUL:"
    );

    console.log(
      "EMAIL:",
      user.email
    );

    console.log(
      "================================"
    );

    /* -------------------------------------------------------
       RESPONSE
    ------------------------------------------------------- */

    return res.status(200).json({
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while resetting password.",
    });
  }
};

/* =========================================================
   EXPORT CONTROLLERS
========================================================= */

module.exports = {
  registerUser,
  loginUser,
  resetPassword,
};