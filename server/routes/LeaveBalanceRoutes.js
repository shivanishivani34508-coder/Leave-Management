const express = require("express");

const router = express.Router();
const {
  createNextYearLeaveBalances,
  createInitialYearLeaveBalances,
  getMyYearlyLeaveBalance,
  getAllYearlyLeaveBalances,
} = require("../controllers/yearlyLeaveBalanceController");

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorize,
} = require("../middleware/roleMiddleware");

/* =========================================================
   CREATE NEXT YEAR LEAVE BALANCES
   ADMIN / HR ONLY
========================================================= */
/* =========================================================
   CREATE INITIAL YEAR LEAVE BALANCES
   ADMIN / HR ONLY

   POST
   /api/yearly-leave-balances/create-initial-year
========================================================= */

router.post(
  "/create-initial-year",
  protect,
  authorize("admin", "hr"),
  createInitialYearLeaveBalances
);

router.post(
  "/create-next-year",
  protect,
  authorize("admin", "hr"),
  createNextYearLeaveBalances
);

/* =========================================================
   GET MY YEARLY LEAVE BALANCE
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
========================================================= */

router.get(
  "/all",
  protect,
  authorize("admin", "hr"),
  getAllYearlyLeaveBalances
);

module.exports = router;