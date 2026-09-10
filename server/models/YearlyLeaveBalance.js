const mongoose = require("mongoose");

/* =========================================================
   LEAVE BALANCE SUB-SCHEMA
========================================================= */

const leaveBalanceSchema = new mongoose.Schema(
  {
    annualAllocation: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    carryForward: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAvailable: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    remaining: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

/* =========================================================
   YEARLY LEAVE BALANCE SCHEMA
========================================================= */

const yearlyLeaveBalanceSchema = new mongoose.Schema(
  {
    /* =====================================================
       EMPLOYEE
    ===================================================== */

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =====================================================
       YEAR
    ===================================================== */

    year: {
      type: Number,
      required: true,
      index: true,
    },

    /* =====================================================
       CASUAL LEAVE
    ===================================================== */

    casual: {
      type: leaveBalanceSchema,
      default: () => ({
        annualAllocation: 0,
        carryForward: 0,
        totalAvailable: 0,
        remaining: 0,
      }),
    },

    /* =====================================================
       SICK LEAVE
    ===================================================== */

    sick: {
      type: leaveBalanceSchema,
      default: () => ({
        annualAllocation: 0,
        carryForward: 0,
        totalAvailable: 0,
        remaining: 0,
      }),
    },

    /* =====================================================
       EARNED LEAVE
    ===================================================== */

    earned: {
      type: leaveBalanceSchema,
      default: () => ({
        annualAllocation: 0,
        carryForward: 0,
        totalAvailable: 0,
        remaining: 0,
      }),
    },

    /* =====================================================
       MARRIAGE LEAVE
    ===================================================== */

    marriage: {
      type: leaveBalanceSchema,
      default: () => ({
        annualAllocation: 0,
        carryForward: 0,
        totalAvailable: 0,
        remaining: 0,
      }),
    },

    /* =====================================================
       MATERNITY LEAVE
    ===================================================== */

    maternity: {
      type: leaveBalanceSchema,
      default: () => ({
        annualAllocation: 0,
        carryForward: 0,
        totalAvailable: 0,
        remaining: 0,
      }),
    },

    /* =====================================================
       PATERNITY LEAVE
    ===================================================== */

    paternity: {
      type: leaveBalanceSchema,
      default: () => ({
        annualAllocation: 0,
        carryForward: 0,
        totalAvailable: 0,
        remaining: 0,
      }),
    },

    /* =====================================================
       BEREAVEMENT LEAVE
    ===================================================== */

    bereavement: {
      type: leaveBalanceSchema,
      default: () => ({
        annualAllocation: 0,
        carryForward: 0,
        totalAvailable: 0,
        remaining: 0,
      }),
    },
  },

  {
    timestamps: true,
  }
);

/* =========================================================
   ONE YEARLY BALANCE PER EMPLOYEE PER YEAR
========================================================= */

yearlyLeaveBalanceSchema.index(
  {
    employee: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

/* =========================================================
   EXPORT MODEL
========================================================= */

module.exports =
  mongoose.models.YearlyLeaveBalance ||
  mongoose.model(
    "YearlyLeaveBalance",
    yearlyLeaveBalanceSchema
  );