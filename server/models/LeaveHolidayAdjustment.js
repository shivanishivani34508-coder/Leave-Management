const mongoose = require("mongoose");

const leaveHolidayAdjustmentSchema = new mongoose.Schema(
  {
    leave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
      required: true,
    },

    holiday: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Holiday",
      required: true,
    },

    holidayDate: {
      type: Date,
      required: true,
    },

    adjustedDays: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

/*
  Prevent the same holiday from adjusting
  the same leave more than once.
*/
leaveHolidayAdjustmentSchema.index(
  {
    leave: 1,
    holiday: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model(
  "LeaveHolidayAdjustment",
  leaveHolidayAdjustmentSchema
);