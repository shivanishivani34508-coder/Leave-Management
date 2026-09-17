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
  required: true,
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

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    excludedHolidayDates: {
  type: [Date],
  default: [],
},

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },

        durationType: {
      type: String,
      enum: ["Full Day", "Half Day"],
      default: "Full Day",
    },

    halfDaySession: {
      type: String,
      enum: ["First Half", "Second Half", null],
      default: null,
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

    status: {
  type: String,
  enum: ["Pending", "Approved", "Rejected", "Cancelled"],
  default: "Pending",
},

requiredApprovals: {
  type: [String],
  enum: ["Manager", "DepartmentHead", "HR", "Admin"],  default: ["Manager"],
},

        managerStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    departmentHeadStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    hrStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    adminStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
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

module.exports =
  mongoose.models.Leave || mongoose.model("Leave", leaveSchema);
