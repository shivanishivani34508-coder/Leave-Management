const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    leaveType: {
      type: String,
      required: true,
      enum: [
        "Casual",
        "Sick",
        "Earned",
        "Marriage",
        "Maternity",
        "Paternity",
        "Bereavement",
        "Leave Without Pay",
      ],
    },

    durationType: {
      type: String,
      enum: ["Full Day", "Half Day"],
      default: "Full Day",
    },

    halfDaySession: {
      type: String,
      enum: ["First Half", "Second Half"],
      default: null,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    excludedHolidayDates: [
      {
        type: Date,
      },
    ],

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    totalDays: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    paidDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    unpaidDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },

    requiredApprovals: {
      type: [String],
      default: ["Manager"],
    },

    managerStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Not Required"],
      default: "Pending",
    },

    departmentHeadStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Not Required"],
      default: "Pending",
    },

    hrStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Not Required"],
      default: "Pending",
    },

    adminStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Not Required"],
      default: "Pending",
    },

    approvedBy: {
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
      admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    approvedAt: {
      manager: {
        type: Date,
        default: null,
      },
      departmentHead: {
        type: Date,
        default: null,
      },
      hr: {
        type: Date,
        default: null,
      },
      admin: {
        type: Date,
        default: null,
      },
    },

    balanceDeducted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Leave =
  mongoose.models.Leave || mongoose.model("Leave", leaveSchema);

module.exports = Leave;