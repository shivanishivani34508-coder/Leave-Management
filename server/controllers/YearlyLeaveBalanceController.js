const User = require("../models/User");
const YearlyLeaveBalance = require("../models/YearlyLeaveBalance");
const LeaveYear = require("../models/LeaveYear");

const {
  LEAVE_CARRY_FORWARD_POLICY,
} = require("../config/leavePolicy");

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

/*
  Get annual allocation safely from policy.
*/
const getAnnualAllocation = (leaveType) => {
  return Number(
    LEAVE_CARRY_FORWARD_POLICY?.[leaveType]?.annualAllocation || 0
  );
};

/*
  Get maximum carry-forward safely from policy.
*/
const getMaxCarryForward = (leaveType) => {
  return Number(
    LEAVE_CARRY_FORWARD_POLICY?.[leaveType]?.maxCarryForward || 0
  );
};

/*
  Calculate carry-forward.
*/
const calculateCarryForward = (remaining, leaveType) => {
  const maxCarryForward = getMaxCarryForward(leaveType);

  return Math.min(
    Math.max(Number(remaining || 0), 0),
    maxCarryForward
  );
};

/*
  Create one yearly leave balance object.
*/
const createBalanceObject = (leaveType, carryForward = 0) => {
  const annualAllocation = getAnnualAllocation(leaveType);

  const safeCarryForward = Math.max(
    Number(carryForward || 0),
    0
  );

  const totalAvailable =
    annualAllocation + safeCarryForward;

  return {
    annualAllocation,
    carryForward: safeCarryForward,
    totalAvailable,
    remaining: totalAvailable,
  };
};


/* =========================================================
   CREATE NEXT YEAR LEAVE BALANCES

   ADMIN / HR ONLY

   EXISTING FUNCTION - KEPT AS IT IS
========================================================= */

const createNextYearLeaveBalances = async (req, res) => {
  try {
    /* =====================================================
       GET CURRENT YEAR
    ===================================================== */

    const currentYear = Number(req.body.currentYear);

    if (!currentYear || currentYear < 2000) {
      return res.status(400).json({
        message: "Please provide a valid current year.",
      });
    }

    const nextYear = currentYear + 1;

    /* =====================================================
       CHECK CURRENT YEAR PROCESSING
    ===================================================== */

    const processedYear = await LeaveYear.findOne({
      year: currentYear,
    });

    if (!processedYear) {
      return res.status(400).json({
        message:
          `Carry-forward for ${currentYear} must be processed first.`,
      });
    }

    /* =====================================================
       GET ALL EMPLOYEES
    ===================================================== */

    const employees = await User.find({
      role: "employee",
    });

    if (employees.length === 0) {
      return res.status(404).json({
        message: "No employees found.",
      });
    }

    let createdEmployees = 0;
    let updatedEmployees = 0;
    let skippedEmployees = 0;

    /* =====================================================
       PROCESS EACH EMPLOYEE
    ===================================================== */

    for (const employee of employees) {
      /* ===================================================
         GET CURRENT YEAR BALANCE
      =================================================== */

      const currentBalance =
        await YearlyLeaveBalance.findOne({
          employee: employee._id,
          year: currentYear,
        });

      if (!currentBalance) {
        console.log(
          `No ${currentYear} yearly balance found for ${employee.name}. Skipping.`
        );

        skippedEmployees++;
        continue;
      }

      /* ===================================================
         READ CURRENT YEAR REMAINING
      =================================================== */

      const casualRemaining = Number(
        currentBalance.casual?.remaining || 0
      );

      const sickRemaining = Number(
        currentBalance.sick?.remaining || 0
      );

      const earnedRemaining = Number(
        currentBalance.earned?.remaining || 0
      );

      /* ===================================================
         CALCULATE CARRY FORWARD
      =================================================== */

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

      console.log(
        `Carry-forward calculation for ${employee.name}:`,
        {
          currentYear,
          nextYear,

          casualRemaining,
          casualCarryForward,

          sickRemaining,
          sickCarryForward,

          earnedRemaining,
          earnedCarryForward,
        }
      );

      /* ===================================================
         CHECK WHETHER NEXT YEAR BALANCE ALREADY EXISTS
      =================================================== */

      const existingNextYearBalance =
        await YearlyLeaveBalance.findOne({
          employee: employee._id,
          year: nextYear,
        });

      /* ===================================================
         NEXT YEAR BALANCE ALREADY EXISTS
      =================================================== */

      if (existingNextYearBalance) {
        /* =================================================
           CHECK WHETHER NEXT YEAR BALANCE IS UNUSED
        ================================================= */

        const casualRemainingNextYear = Number(
          existingNextYearBalance.casual?.remaining || 0
        );

        const casualTotalNextYear = Number(
          existingNextYearBalance.casual?.totalAvailable || 0
        );

        const sickRemainingNextYear = Number(
          existingNextYearBalance.sick?.remaining || 0
        );

        const sickTotalNextYear = Number(
          existingNextYearBalance.sick?.totalAvailable || 0
        );

        const earnedRemainingNextYear = Number(
          existingNextYearBalance.earned?.remaining || 0
        );

        const earnedTotalNextYear = Number(
          existingNextYearBalance.earned?.totalAvailable || 0
        );

        const casualCarryExisting = Number(
          existingNextYearBalance.casual?.carryForward || 0
        );

        const sickCarryExisting = Number(
          existingNextYearBalance.sick?.carryForward || 0
        );

        const earnedCarryExisting = Number(
          existingNextYearBalance.earned?.carryForward || 0
        );

        const nextYearBalanceIsUnused =
          casualRemainingNextYear === casualTotalNextYear &&
          sickRemainingNextYear === sickTotalNextYear &&
          earnedRemainingNextYear === earnedTotalNextYear;

        const carryForwardNotProcessed =
          casualCarryExisting === 0 &&
          sickCarryExisting === 0 &&
          earnedCarryExisting === 0;

        /* =================================================
           UPDATE FRESH NEXT YEAR BALANCE
        ================================================= */

        if (
          nextYearBalanceIsUnused &&
          carryForwardNotProcessed
        ) {
          /* ===============================================
             CASUAL
          =============================================== */

          existingNextYearBalance.casual =
            createBalanceObject(
              "casual",
              casualCarryForward
            );

          /* ===============================================
             SICK
          =============================================== */

          existingNextYearBalance.sick =
            createBalanceObject(
              "sick",
              sickCarryForward
            );

          /* ===============================================
             EARNED
          =============================================== */

          existingNextYearBalance.earned =
            createBalanceObject(
              "earned",
              earnedCarryForward
            );

          /* ===============================================
             SPECIAL LEAVES
             
             These do NOT carry forward.
          =============================================== */

          existingNextYearBalance.marriage =
            createBalanceObject("marriage", 0);

          existingNextYearBalance.maternity =
            createBalanceObject("maternity", 0);

          existingNextYearBalance.paternity =
            createBalanceObject("paternity", 0);

          existingNextYearBalance.bereavement =
            createBalanceObject("bereavement", 0);

          await existingNextYearBalance.save();

          updatedEmployees++;

          console.log(
            `${nextYear} balance UPDATED for ${employee.name}`
          );
        } else {
          /* ===============================================
             DO NOT MODIFY USED / ALREADY PROCESSED BALANCE
          =============================================== */

          skippedEmployees++;

          console.log(
            `${nextYear} balance SKIPPED for ${employee.name} - already processed or used`
          );
        }

        continue;
      }

      /* ===================================================
         CREATE NEW NEXT YEAR BALANCE
      =================================================== */

      await YearlyLeaveBalance.create({
        employee: employee._id,
        year: nextYear,

        casual:
          createBalanceObject(
            "casual",
            casualCarryForward
          ),

        sick:
          createBalanceObject(
            "sick",
            sickCarryForward
          ),

        earned:
          createBalanceObject(
            "earned",
            earnedCarryForward
          ),

        marriage:
          createBalanceObject(
            "marriage",
            0
          ),

        maternity:
          createBalanceObject(
            "maternity",
            0
          ),

        paternity:
          createBalanceObject(
            "paternity",
            0
          ),

        bereavement:
          createBalanceObject(
            "bereavement",
            0
          ),
      });

      createdEmployees++;

      console.log(
        `${nextYear} balance CREATED for ${employee.name}`
      );

      console.log(
        `Carry-forward for ${employee.name}:`,
        {
          casual: casualCarryForward,
          sick: sickCarryForward,
          earned: earnedCarryForward,
        }
      );
    }

    /* =====================================================
       SUCCESS RESPONSE
    ===================================================== */

    return res.status(200).json({
      message:
        `Yearly leave balances processed successfully for ${nextYear}.`,

      currentYear,

      nextYear,

      createdEmployees,

      updatedEmployees,

      skippedEmployees,
    });
  } catch (error) {
    console.error(
      "CREATE NEXT YEAR BALANCE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while creating next year's leave balances.",
      error: error.message,
    });
  }
};


/* =========================================================
   GET MY YEARLY LEAVE BALANCE

   EXISTING FUNCTION - KEPT AS IT IS
========================================================= */

const getMyYearlyLeaveBalance = async (req, res) => {
  try {
    const year = Number(
      req.query.year || new Date().getFullYear()
    );

    const employeeId =
      req.user._id || req.user.id;

    const balance =
      await YearlyLeaveBalance.findOne({
        employee: employeeId,
        year,
      }).populate(
        "employee",
        "name email department"
      );

    if (!balance) {
      return res.status(404).json({
        message:
          `No yearly leave balance found for ${year}.`,
      });
    }

    return res.status(200).json({
      message:
        "Yearly leave balance fetched successfully.",

      balance,
    });
  } catch (error) {
    console.error(
      "GET MY YEARLY BALANCE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while fetching yearly leave balance.",
    });
  }
};


/* =========================================================
   GET ALL YEARLY LEAVE BALANCES

   ADMIN / HR

   EXISTING FUNCTION - KEPT AS IT IS
========================================================= */

const getAllYearlyLeaveBalances = async (req, res) => {
  try {
    const year = Number(
      req.query.year || new Date().getFullYear()
    );

    const balances =
      await YearlyLeaveBalance.find({
        year,
      })
        .populate(
          "employee",
          "name email department role"
        )
        .sort({
          "employee.name": 1,
        });

    return res.status(200).json({
      message:
        "Yearly leave balances fetched successfully.",

      year,

      totalEmployees:
        balances.length,

      balances,
    });
  } catch (error) {
    console.error(
      "GET ALL YEARLY BALANCES ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while fetching yearly leave balances.",
    });
  }
};


/* =========================================================
   CREATE INITIAL YEAR LEAVE BALANCES

   ADMIN / HR ONLY

   EXISTING FUNCTION - KEPT AS IT IS
========================================================= */

const createInitialYearLeaveBalances = async (req, res) => {
  try {
    const year = Number(req.body.year);

    /* =====================================================
       VALIDATE YEAR
    ===================================================== */

    if (!year || year < 2000) {
      return res.status(400).json({
        message: "Please provide a valid year.",
      });
    }

    /* =====================================================
       CHECK WHETHER BALANCES ALREADY EXIST
    ===================================================== */

    const existingBalance =
      await YearlyLeaveBalance.findOne({
        year,
      });

    if (existingBalance) {
      return res.status(409).json({
        message:
          `Yearly leave balances for ${year} already exist.`,

        year,
      });
    }

    /* =====================================================
       GET ALL EMPLOYEES
    ===================================================== */

    const employees = await User.find({
      role: "employee",
    });

    if (employees.length === 0) {
      return res.status(404).json({
        message: "No employees found.",
      });
    }

    let createdEmployees = 0;

    /* =====================================================
       CREATE INITIAL BALANCE FOR EACH EMPLOYEE
    ===================================================== */

    for (const employee of employees) {
      await YearlyLeaveBalance.create({
        employee: employee._id,

        year,

        /* ===============================================
           CASUAL
        =============================================== */

        casual:
          createBalanceObject(
            "casual",
            0
          ),

        /* ===============================================
           SICK
        =============================================== */

        sick:
          createBalanceObject(
            "sick",
            0
          ),

        /* ===============================================
           EARNED
        =============================================== */

        earned:
          createBalanceObject(
            "earned",
            0
          ),

        /* ===============================================
           SPECIAL LEAVES
        =============================================== */

        marriage:
          createBalanceObject(
            "marriage",
            0
          ),

        maternity:
          createBalanceObject(
            "maternity",
            0
          ),

        paternity:
          createBalanceObject(
            "paternity",
            0
          ),

        bereavement:
          createBalanceObject(
            "bereavement",
            0
          ),
      });

      createdEmployees++;

      console.log(
        `${year} balance created for ${employee.name}`
      );
    }

    /* =====================================================
       SUCCESS RESPONSE
    ===================================================== */

    return res.status(200).json({
      message:
        `Initial yearly leave balances created successfully for ${year}.`,

      year,

      createdEmployees,
    });
  } catch (error) {
    console.error(
      "CREATE INITIAL YEAR BALANCE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while creating initial yearly leave balances.",
      error: error.message,
    });
  }
};


/* =========================================================
   MIGRATE MISSING YEARLY BALANCES

   ONE-TIME MIGRATION FOR OLD EMPLOYEES
========================================================= */

const migrateMissingYearlyBalances = async (req, res) => {
  try {
    const year = Number(req.body.year);

    if (!year) {
      return res.status(400).json({
        message: "Year is required.",
      });
    }

    const employees = await User.find({
      role: "employee",
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
          reason: "Yearly balance already exists",
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
          annualAllocation: casualAllocation,
          carryForward: 0,
          totalAvailable: casualAllocation,
          remaining: casualRemaining,
        },

        sick: {
          annualAllocation: sickAllocation,
          carryForward: 0,
          totalAvailable: sickAllocation,
          remaining: sickRemaining,
        },

        earned: {
          annualAllocation: earnedAllocation,
          carryForward: 0,
          totalAvailable: earnedAllocation,
          remaining: earnedRemaining,
        },

        marriage: {
          annualAllocation: marriageAllocation,
          carryForward: 0,
          totalAvailable: marriageAllocation,
          remaining: marriageRemaining,
        },

        maternity: {
          annualAllocation: maternityAllocation,
          carryForward: 0,
          totalAvailable: maternityAllocation,
          remaining: maternityRemaining,
        },

        paternity: {
          annualAllocation: paternityAllocation,
          carryForward: 0,
          totalAvailable: paternityAllocation,
          remaining: paternityRemaining,
        },

        bereavement: {
          annualAllocation: bereavementAllocation,
          carryForward: 0,
          totalAvailable: bereavementAllocation,
          remaining: bereavementRemaining,
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

   ONE-TIME USE FOR OLD EMPLOYEES

   THIS IS THE NEW FUNCTION
========================================================= */

const repairMissingCarryForward = async (req, res) => {
  try {
    const currentYear =
      Number(req.body.currentYear);

    if (!currentYear || currentYear < 2000) {
      return res.status(400).json({
        message:
          "Please provide a valid current year.",
      });
    }

    const nextYear =
      currentYear + 1;

    const employees =
      await User.find({
        role: "employee",
      });

    if (employees.length === 0) {
      return res.status(404).json({
        message:
          "No employees found.",
      });
    }

    let updatedEmployees = 0;
    let skippedEmployees = 0;

    const updatedList = [];
    const skippedList = [];

    for (const employee of employees) {
      /* ===================================================
         GET CURRENT YEAR BALANCE
      =================================================== */

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
            `No ${currentYear} yearly balance found`,
        });

        continue;
      }

      /* ===================================================
         GET NEXT YEAR BALANCE
      =================================================== */

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
            `No ${nextYear} yearly balance found`,
        });

        continue;
      }

      /* ===================================================
         CALCULATE CARRY-FORWARD
      =================================================== */

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

      /* ===================================================
         CHECK NEXT YEAR BALANCE IS UNUSED
      =================================================== */

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

      /* ===================================================
         UPDATE ONLY CARRY-FORWARD LEAVES
      =================================================== */

      nextYearBalance.casual =
        createBalanceObject(
          "casual",
          casualCarryForward
        );

      nextYearBalance.sick =
        createBalanceObject(
          "sick",
          sickCarryForward
        );

      nextYearBalance.earned =
        createBalanceObject(
          "earned",
          earnedCarryForward
        );

      /* ===================================================
         SPECIAL LEAVES DO NOT CARRY FORWARD
      =================================================== */

      nextYearBalance.marriage =
        createBalanceObject(
          "marriage",
          0
        );

      nextYearBalance.maternity =
        createBalanceObject(
          "maternity",
          0
        );

      nextYearBalance.paternity =
        createBalanceObject(
          "paternity",
          0
        );

      nextYearBalance.bereavement =
        createBalanceObject(
          "bereavement",
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