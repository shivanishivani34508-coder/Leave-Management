const express = require("express");

const router = express.Router();

/* =========================================================
   CONTROLLERS
========================================================= */

const {
  createNextYearLeaveBalances,
  getMyYearlyLeaveBalance,
  getAllYearlyLeaveBalances,
  createInitialYearLeaveBalances,
  migrateMissingYearlyBalances,
  repairMissingCarryForward
} = require("../controllers/yearlyLeaveBalanceController");


/* =========================================================
   MIDDLEWARE
========================================================= */

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorize,
} = require("../middleware/roleMiddleware");


/* =========================================================
   CREATE NEXT YEAR LEAVE BALANCES
   ADMIN / HR ONLY

   POST
   /api/yearly-leave-balances/create-next-year
========================================================= */

router.post(
  "/create-next-year",
  protect,
  authorize("admin", "hr"),
  createNextYearLeaveBalances
);


/* =========================================================
   MIGRATE MISSING YEARLY BALANCES
   ADMIN / HR ONLY

   POST
   /api/yearly-leave-balances/migrate-missing
========================================================= */

router.post(
  "/migrate-missing",
  protect,
  authorize("admin", "hr"),
  migrateMissingYearlyBalances
);


/* =========================================================
   REPAIR MISSING CARRY-FORWARD
   ADMIN / HR ONLY

   POST
   /api/yearly-leave-balances/repair-carry-forward
========================================================= */

router.post(
  "/repair-carry-forward",
  protect,
  authorize("admin", "hr"),
  repairMissingCarryForward
);


/* =========================================================
   GET MY YEARLY LEAVE BALANCE

   GET
   /api/yearly-leave-balances/my?year=2027
========================================================= */

router.get(
  "/my",
  protect,
  authorize(
    "employee",
    "manager",
    "departmentHead",
    "hr",
    "admin"
  ),
  getMyYearlyLeaveBalance
);


/* =========================================================
   GET ALL YEARLY LEAVE BALANCES
   ADMIN / HR ONLY

   GET
   /api/yearly-leave-balances/all?year=2027
========================================================= */

router.get(
  "/all",
  protect,
  authorize("admin", "hr"),
  getAllYearlyLeaveBalances
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;