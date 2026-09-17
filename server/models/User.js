const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
  {
    casual: {
      type: Number,
      default: 12,
    },

    sick: {
      type: Number,
      default: 12,
    },

    earned: {
      type: Number,
      default: 18,
    },

    marriage: {
      type: Number,
      default: 5,
    },

    maternity: {
      type: Number,
      default: 182,
    },

    paternity: {
      type: Number,
      default: 15,
    },

    bereavement: {
      type: Number,
      default: 5,
    },

    leaveWithoutPay: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: [
        "employee",
        "manager",
        "departmentHead",
        "hr",
        "admin",
      ],
      default: "employee",
    },

    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    departmentHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    hr: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    leaveBalances: {
      type: leaveBalanceSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;