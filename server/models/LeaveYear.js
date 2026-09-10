const mongoose = require("mongoose");

const leaveYearSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
    },

    nextYear: {
      type: Number,
      required: true,
    },

    processedAt: {
      type: Date,
      default: Date.now,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: ["Processed"],
      default: "Processed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.LeaveYear ||
  mongoose.model(
    "LeaveYear",
    leaveYearSchema
  );