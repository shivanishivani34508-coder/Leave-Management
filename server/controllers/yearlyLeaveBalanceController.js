const User = require("../models/User");
const YearlyLeaveBalance = require("../models/YearlyLeaveBalance");
const LeaveYear = require("../models/LeaveYear");
const {
  getLeavePolicy,
  getCarryForwardLimit,
} = require("../config/leavePolicy");

/* =========================================================
   CARRY FORWARD CALCULATION
========================================================= */
const calculateCarryForward = (remaining, leaveType) => {
  const safeRemaining = Math.max(
    0,
    Number(remaining) || 0
  );

  const normalizedType = String(leaveType).toLowerCase();

  if (!["casual", "sick", "earned"].includes(normalizedType)) {
    return 0;
  }

  const maxCarryForward = getCarryForwardLimit(normalizedType);

  return Math.min(safeRemaining, maxCarryForward);
};


/* =========================================================
   HELPER
========================================================= */
const createBalanceObject = (
  leaveType,
  annualAllocation,
  carryForward = 0
) => {
  const safeCarryForward = Math.max(
    0,
    Number(carryForward) || 0
  );

  const totalAvailable =
    Number(annualAllocation) + safeCarryForward;

  return {
    annualAllocation: Number(annualAllocation),
    carryForward: safeCarryForward,
    totalAvailable,
    remaining: totalAvailable,
    pending: 0,
    used: 0,
  };
};
/* =========================================================
   CREATE NEXT YEAR LEAVE BALANCES
========================================================= */

const createNextYearLeaveBalances = async ( req,res) => {
  try {
   const currentYear =
  Number(req.body?.currentYear) ||
  new Date().getFullYear();

const nextYear = currentYear + 1;

    const employees = await User.find({
      role: {
        $in: [
          "employee",
          "manager",
          "departmentHead",
          "hr",
        ],
      },
    });

    let created = 0;
    let skipped = 0;

    const createdEmployees = [];
    const skippedEmployees = [];

    for (const employee of employees) {
      const existingBalance =
        await YearlyLeaveBalance.findOne({
          employee: employee._id,
          year: nextYear,
        });

      if (existingBalance) {
        skipped++;

        skippedEmployees.push({
          name: employee.name,
          email: employee.email,
          reason:
            "Yearly balance already exists",
        });

        continue;
      }

      const policy = await getLeavePolicy(
        employee.department
      );

      const casualAllocation =
        Number(policy?.casual || 12);

      const sickAllocation =
        Number(policy?.sick || 12);

      const earnedAllocation =
        Number(policy?.earned || 18);

      const marriageAllocation =
        Number(policy?.marriage || 5);

      const maternityAllocation =
        Number(policy?.maternity || 182);

      const paternityAllocation =
        Number(policy?.paternity || 15);

      const bereavementAllocation =
        Number(policy?.bereavement || 5);

      await YearlyLeaveBalance.create({
        employee: employee._id,

        year: nextYear,

        casual: createBalanceObject(
          "casual",
          casualAllocation
        ),

        sick: createBalanceObject(
          "sick",
          sickAllocation
        ),

        earned: createBalanceObject(
          "earned",
          earnedAllocation
        ),

        marriage: createBalanceObject(
          "marriage",
          marriageAllocation
        ),

        maternity: createBalanceObject(
          "maternity",
          maternityAllocation
        ),

        paternity: createBalanceObject(
          "paternity",
          paternityAllocation
        ),

        bereavement: createBalanceObject(
          "bereavement",
          bereavementAllocation
        ),
      });

      created++;

      createdEmployees.push({
        name: employee.name,
        email: employee.email,
      });
    }

    return res.status(200).json({
      message:
        `Leave balances created for ${nextYear}.`,

      currentYear,

      nextYear,

      totalEmployees: employees.length,

      created,

      skipped,

      createdEmployees,

      skippedEmployees,
    });
  } catch (error) {
    console.error(
      "Create next year balances error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create next year leave balances.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET MY YEARLY LEAVE BALANCE
========================================================= */

const getMyYearlyLeaveBalance = async ( req,res) => {
  try {
    const employeeId = req.user._id;

    const year =
      Number(req.query.year) ||
      new Date().getFullYear();

    const balance =
      await YearlyLeaveBalance.findOne({
        employee: employeeId,
        year,
      }).populate(
        "employee",
        "name email role department"
      );

    if (!balance) {
      return res.status(404).json({
        message:
          `No yearly leave balance found for ${year}.`,
      });
    }

    return res.status(200).json(balance);
  } catch (error) {
    console.error(
      "Get my yearly balance error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch yearly leave balance.",
      error: error.message,
    });
  }
};

/* =========================================================
   GET ALL YEARLY LEAVE BALANCES
========================================================= */

const getAllYearlyLeaveBalances = async (
  req,
  res
) => {
  try {
    const year =
      Number(req.query.year) ||
      new Date().getFullYear();

    const balances =
      await YearlyLeaveBalance.find({
        year,
      }).populate(
        "employee",
        "name email role department"
      );

    return res.status(200).json({
      year,
      total: balances.length,
      balances,
    });
  } catch (error) {
    console.error(
      "Get all yearly balances error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to fetch yearly leave balances.",
      error: error.message,
    });
  }
};

/* =========================================================
   CREATE INITIAL YEAR LEAVE BALANCES
========================================================= */

const createInitialYearLeaveBalances = async (
  req,
  res
) => {
  try {
    const year = Number(req.body.year);

    if (!year) {
      return res.status(400).json({
        message: "Year is required.",
      });
    }

    const employees = await User.find({
      role: {
        $in: [
          "employee",
          "manager",
          "departmentHead",
          "hr",
        ],
      },
    });

    let created = 0;
    let skipped = 0;

    const createdEmployees = [];
    const skippedEmployees = [];

    for (const employee of employees) {
      const existingBalance =
        await YearlyLeaveBalance.findOne({
          employee: employee._id,
          year,
        });

      if (existingBalance) {
        skipped++;

        skippedEmployees.push({
          name: employee.name,
          email: employee.email,
          reason:
            "Yearly balance already exists",
        });

        continue;
      }

      const userBalances =
        employee.leaveBalances || {};

      const casualAllocation = 12;
      const sickAllocation = 12;
      const earnedAllocation = 18;

      const marriageAllocation = 5;
      const maternityAllocation = 182;
      const paternityAllocation = 15;
      const bereavementAllocation = 5;

      const casualRemaining =
        Number(
          userBalances.casual ??
            casualAllocation
        );

      const sickRemaining =
        Number(
          userBalances.sick ??
            sickAllocation
        );

      const earnedRemaining =
        Number(
          userBalances.earned ??
            earnedAllocation
        );

      const marriageRemaining =
        Number(
          userBalances.marriage ??
            marriageAllocation
        );

      const maternityRemaining =
        Number(
          userBalances.maternity ??
            maternityAllocation
        );

      const paternityRemaining =
        Number(
          userBalances.paternity ??
            paternityAllocation
        );

      const bereavementRemaining =
        Number(
          userBalances.bereavement ??
            bereavementAllocation
        );

      await YearlyLeaveBalance.create({
        employee: employee._id,

        year,

        casual: {
          annualAllocation:
            casualAllocation,
          carryForward: 0,
          totalAvailable:
            casualAllocation,
          remaining:
            casualRemaining,
        },

        sick: {
          annualAllocation:
            sickAllocation,
          carryForward: 0,
          totalAvailable:
            sickAllocation,
          remaining:
            sickRemaining,
        },

        earned: {
          annualAllocation:
            earnedAllocation,
          carryForward: 0,
          totalAvailable:
            earnedAllocation,
          remaining:
            earnedRemaining,
        },

        marriage: {
          annualAllocation:
            marriageAllocation,
          carryForward: 0,
          totalAvailable:
            marriageAllocation,
          remaining:
            marriageRemaining,
        },

        maternity: {
          annualAllocation:
            maternityAllocation,
          carryForward: 0,
          totalAvailable:
            maternityAllocation,
          remaining:
            maternityRemaining,
        },

        paternity: {
          annualAllocation:
            paternityAllocation,
          carryForward: 0,
          totalAvailable:
            paternityAllocation,
          remaining:
            paternityRemaining,
        },

        bereavement: {
          annualAllocation:
            bereavementAllocation,
          carryForward: 0,
          totalAvailable:
            bereavementAllocation,
          remaining:
            bereavementRemaining,
        },
      });

      created++;

      createdEmployees.push({
        name: employee.name,
        email: employee.email,
      });
    }

    return res.status(200).json({
      message:
        "Initial yearly balances created successfully.",

      year,

      totalEmployees: employees.length,

      created,

      skipped,

      createdEmployees,

      skippedEmployees,
    });
  } catch (error) {
    console.error(
      "Create initial yearly balances error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create initial yearly leave balances.",
      error: error.message,
    });
  }
};

/* =========================================================
   MIGRATE MISSING YEARLY BALANCES
========================================================= */

const migrateMissingYearlyBalances = async (
  req,
  res
) => {
  try {
    const year = Number(req.body.year);

    if (!year) {
      return res.status(400).json({
        message: "Year is required.",
      });
    }

    const employees = await User.find({
      role: {
        $in: [
          "employee",
          "manager",
          "departmentHead",
          "hr",
        ],
      },
    });

    // TEMPORARY DEBUGGING
    console.log(
      "MIGRATION USERS COUNT:",
      employees.length
    );

    console.log(
      "MIGRATION USERS:",
      employees.map((u) => ({
        name: u.name,
        role: u.role,
        id: u._id,
      }))
    );

    let created = 0;
    let skipped = 0;

    const createdEmployees = [];
    const skippedEmployees = [];

    for (const employee of employees) {
      const existingBalance =
        await YearlyLeaveBalance.findOne({
          employee: employee._id,
          year,
        });

      if (existingBalance) {
        skipped++;

        skippedEmployees.push({
          name: employee.name,
          email: employee.email,
          reason:
            "Yearly balance already exists",
        });

        continue;
      }

      const userBalances =
        employee.leaveBalances || {};

      const casualAllocation = 12;
      const sickAllocation = 12;
      const earnedAllocation = 18;

      const marriageAllocation = 5;
      const maternityAllocation = 182;
      const paternityAllocation = 15;
      const bereavementAllocation = 5;

      const casualRemaining =
        Number(
          userBalances.casual ??
            casualAllocation
        );

      const sickRemaining =
        Number(
          userBalances.sick ??
            sickAllocation
        );

      const earnedRemaining =
        Number(
          userBalances.earned ??
            earnedAllocation
        );

      const marriageRemaining =
        Number(
          userBalances.marriage ??
            marriageAllocation
        );

      const maternityRemaining =
        Number(
          userBalances.maternity ??
            maternityAllocation
        );

      const paternityRemaining =
        Number(
          userBalances.paternity ??
            paternityAllocation
        );

      const bereavementRemaining =
        Number(
          userBalances.bereavement ??
            bereavementAllocation
        );

      await YearlyLeaveBalance.create({
        employee: employee._id,

        year,

        casual: {
          annualAllocation:
            casualAllocation,
          carryForward: 0,
          totalAvailable:
            casualAllocation,
          remaining:
            casualRemaining,
        },

        sick: {
          annualAllocation:
            sickAllocation,
          carryForward: 0,
          totalAvailable:
            sickAllocation,
          remaining:
            sickRemaining,
        },

        earned: {
          annualAllocation:
            earnedAllocation,
          carryForward: 0,
          totalAvailable:
            earnedAllocation,
          remaining:
            earnedRemaining,
        },

        marriage: {
          annualAllocation:
            marriageAllocation,
          carryForward: 0,
          totalAvailable:
            marriageAllocation,
          remaining:
            marriageRemaining,
        },

        maternity: {
          annualAllocation:
            maternityAllocation,
          carryForward: 0,
          totalAvailable:
            maternityAllocation,
          remaining:
            maternityRemaining,
        },

        paternity: {
          annualAllocation:
            paternityAllocation,
          carryForward: 0,
          totalAvailable:
            paternityAllocation,
          remaining:
            paternityRemaining,
        },

        bereavement: {
          annualAllocation:
            bereavementAllocation,
          carryForward: 0,
          totalAvailable:
            bereavementAllocation,
          remaining:
            bereavementRemaining,
        },
      });

      created++;

      createdEmployees.push({
        name: employee.name,
        email: employee.email,
      });
    }

    return res.status(200).json({
      message:
        "Missing yearly balances migrated successfully.",

      year,

      totalEmployees: employees.length,

      created,

      skipped,

      createdEmployees,

      skippedEmployees,
    });
  } catch (error) {
    console.error(
      "Migration error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to migrate yearly balances.",
      error: error.message,
    });
  }
};
/* =========================================================
   REPAIR MISSING CARRY-FORWARD
========================================================= */

const repairMissingCarryForward = async (req,res) => {
  try {
    const currentYear =
  Number(req.body?.currentYear) ||
  new Date().getFullYear();
    const nextYear = currentYear + 1;

    const employees = await User.find({
      role: {
        $in: [
          "employee",
          "manager",
          "departmentHead",
          "hr",
        ],
      },
    });

    let updatedEmployees = 0;
    let skippedEmployees = 0;

    const updatedList = [];
    const skippedList = [];

    for (const employee of employees) {
      const currentBalance =
        await YearlyLeaveBalance.findOne({
          employee: employee._id,
          year: currentYear,
        });

      if (!currentBalance) {
        skippedEmployees++;

        skippedList.push({
          name: employee.name,
          email: employee.email,
          reason:
            `Current year balance ${currentYear} not found`,
        });

        continue;
      }

      const nextYearBalance =
        await YearlyLeaveBalance.findOne({
          employee: employee._id,
          year: nextYear,
        });

      if (!nextYearBalance) {
        skippedEmployees++;

        skippedList.push({
          name: employee.name,
          email: employee.email,
          reason:
            `Next year balance ${nextYear} not found`,
        });

        continue;
      }

      const casualRemaining =
        Number(
          currentBalance.casual?.remaining || 0
        );

      const sickRemaining =
        Number(
          currentBalance.sick?.remaining || 0
        );

      const earnedRemaining =
        Number(
          currentBalance.earned?.remaining || 0
        );

      const casualCarryForward =
        calculateCarryForward(
          casualRemaining,
          "casual"
        );

      const sickCarryForward =
        calculateCarryForward(
          sickRemaining,
          "sick"
        );

      const earnedCarryForward =
        calculateCarryForward(
          earnedRemaining,
          "earned"
        );

      const casualUnused =
        Number(
          nextYearBalance.casual?.remaining || 0
        ) ===
        Number(
          nextYearBalance.casual?.totalAvailable || 0
        );

      const sickUnused =
        Number(
          nextYearBalance.sick?.remaining || 0
        ) ===
        Number(
          nextYearBalance.sick?.totalAvailable || 0
        );

      const earnedUnused =
        Number(
          nextYearBalance.earned?.remaining || 0
        ) ===
        Number(
          nextYearBalance.earned?.totalAvailable || 0
        );

      if (
        !casualUnused ||
        !sickUnused ||
        !earnedUnused
      ) {
        skippedEmployees++;

        skippedList.push({
          name: employee.name,
          email: employee.email,
          reason:
            "Next year balance has already been used",
        });

        continue;
      }

      nextYearBalance.casual =
        createBalanceObject(
          "casual",
          12,
          casualCarryForward
        );

      nextYearBalance.sick =
        createBalanceObject(
          "sick",
          12,
          sickCarryForward
        );

      nextYearBalance.earned =
        createBalanceObject(
          "earned",
          18,
          earnedCarryForward
        );

      nextYearBalance.marriage =
        createBalanceObject(
          "marriage",
          5,
          0
        );

      nextYearBalance.maternity =
        createBalanceObject(
          "maternity",
          182,
          0
        );

      nextYearBalance.paternity =
        createBalanceObject(
          "paternity",
          15,
          0
        );

      nextYearBalance.bereavement =
        createBalanceObject(
          "bereavement",
          5,
          0
        );

      await nextYearBalance.save();

      updatedEmployees++;

      updatedList.push({
        name: employee.name,
        email: employee.email,
        casualCarryForward,
        sickCarryForward,
        earnedCarryForward,
      });
    }

    return res.status(200).json({
      message:
        `Missing carry-forward repaired successfully for ${nextYear}.`,

      currentYear,

      nextYear,

      updatedEmployees,

      skippedEmployees,

      updatedList,

      skippedList,
    });
  } catch (error) {
    console.error(
      "REPAIR CARRY-FORWARD ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while repairing carry-forward.",
      error: error.message,
    });
  }
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  createNextYearLeaveBalances,
  createInitialYearLeaveBalances,
  getMyYearlyLeaveBalance,
  getAllYearlyLeaveBalances,
  migrateMissingYearlyBalances,
  repairMissingCarryForward,
};