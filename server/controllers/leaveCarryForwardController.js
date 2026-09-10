const User = require("../models/User");
const LeaveYear = require("../models/LeaveYear");

const {
  LEAVE_CARRY_FORWARD_POLICY,
} = require("../config/leavePolicy");

/* =========================================================
   PROCESS YEAR-END CARRY FORWARD
========================================================= */

const processYearEndCarryForward = async (req, res) => {
  try {
    const currentYear = Number(req.body.currentYear);

    /* ===================================================
       VALIDATE CURRENT YEAR
    =================================================== */

    if (!currentYear || currentYear < 2000) {
      return res.status(400).json({
        message: "Please provide a valid current year.",
      });
    }

    const nextYear = currentYear + 1;

    /* ===================================================
       CHECK WHETHER THIS YEAR WAS ALREADY PROCESSED
    =================================================== */

    const existingYear = await LeaveYear.findOne({
      year: currentYear,
    });

    if (existingYear) {
      return res.status(409).json({
        message:
          `Carry-forward for ${currentYear} has already been processed.`,
        year: currentYear,
        nextYear: existingYear.nextYear,
        processedAt: existingYear.processedAt,
      });
    }

    /* ===================================================
       GET EMPLOYEES
    =================================================== */

    const employees = await User.find({
      role: "employee",
    });

    if (employees.length === 0) {
      return res.status(404).json({
        message: "No employees found.",
      });
    }

    let processedEmployees = 0;

    /* ===================================================
       PROCESS EACH EMPLOYEE
    =================================================== */

    for (const employee of employees) {
      const balance = employee.leaveBalances;

      if (!balance) {
        continue;
      }

      /* =================================================
         ENSURE CARRY FORWARD OBJECT EXISTS
      ================================================= */

      if (!balance.carryForward) {
        balance.carryForward = {
          casual: 0,
          sick: 0,
          earned: 0,
          marriage: 0,
          maternity: 0,
          paternity: 0,
          bereavement: 0,
        };
      }

      /* ===============================================
         CASUAL LEAVE
      =============================================== */

      balance.carryForward.casual = Math.min(
        Number(balance.casual ?? 0),
        LEAVE_CARRY_FORWARD_POLICY.casual.maxCarryForward
      );

      /* ===============================================
         SICK LEAVE
      =============================================== */

      balance.carryForward.sick = Math.min(
        Number(balance.sick ?? 0),
        LEAVE_CARRY_FORWARD_POLICY.sick.maxCarryForward
      );

      /* ===============================================
         EARNED LEAVE
      =============================================== */

      balance.carryForward.earned = Math.min(
        Number(balance.earned ?? 0),
        LEAVE_CARRY_FORWARD_POLICY.earned.maxCarryForward
      );

      /* ===============================================
         NON-CARRY-FORWARD LEAVES
      =============================================== */

      balance.carryForward.marriage = 0;
      balance.carryForward.maternity = 0;
      balance.carryForward.paternity = 0;
      balance.carryForward.bereavement = 0;

      await employee.save();

      processedEmployees++;

      console.log(
        `Carry forward processed for ${employee.name}`
      );
    }

    /* ===================================================
       SAVE PROCESSED YEAR
    =================================================== */

    await LeaveYear.create({
      year: currentYear,
      nextYear,
      processedBy:
        req.user?._id ||
        req.user?.id ||
        null,
    });

    /* ===================================================
       SUCCESS RESPONSE
    =================================================== */

    return res.status(200).json({
      message:
        `Carry-forward processing completed for ${nextYear}.`,
      currentYear,
      nextYear,
      processedEmployees,
    });
  } catch (error) {
    console.error(
      "CARRY FORWARD ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while processing carry-forward leaves.",
    });
  }
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  processYearEndCarryForward,
};