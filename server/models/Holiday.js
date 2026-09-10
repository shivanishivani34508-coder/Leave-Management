const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    holidayName: {
      type: String,
      required: true,
      trim: true,
    },

    holidayDate: {
      type: Date,
      required: true,
    },

    holidayType: {
      type: String,
      enum: [
        "National",
        "Festival",
        "Company",
        "Optional",
      ],
      default: "National",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Holiday", holidaySchema);