const express = require("express");
const {
  getUsers,
  createEmployee,
  getProfile,
  getUserById,
  getManagers,
  getDepartmentHeads,
  updateProfile,
  changePassword,
  updateLeaveBalance,
  updateEmployee,
  deleteUser,
  getMyTeam,
} = require("../controllers/userController");
const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorize,
} = require("../middleware/roleMiddleware");

const router = express.Router();

/* =========================================================
   LOGGED-IN USER PROFILE
========================================================= */

router.get(
  "/profile",
  protect,
  getProfile
);

router.put(
  "/profile",
  protect,
  updateProfile
);

router.put(
  "/change-password",
  protect,
  changePassword
);

/* =========================================================
   CREATE EMPLOYEE
========================================================= */

router.post(
  "/employee",
  protect,
  authorize("admin"),
  createEmployee
);

/* =========================================================
   GET ALL USERS
========================================================= */

router.get(
  "/",
  protect,
  authorize("admin"),
  getUsers
);


/* =========================================================
   GET ALL MANAGERS
========================================================= */

router.get(
  "/managers",
  protect,
  authorize("admin"),
  getManagers
);

/* =========================================================
   GET ALL DEPARTMENT HEADS
========================================================= */

router.get(
  "/department-heads",
  protect,
  authorize("admin"),
  getDepartmentHeads
);

/* =========================================================
   GET MY TEAM
========================================================= */

router.get(
  "/my-team",
  protect,
  authorize("manager"),
  getMyTeam
);


/* =========================================================
   GET ONE EMPLOYEE
========================================================= */
router.get(
  "/:id",
  protect,
  authorize("admin", "manager"),
  getUserById
);
/* =========================================================
   UPDATE EMPLOYEE
========================================================= */

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateEmployee
);

/* =========================================================
   UPDATE LEAVE BALANCE
========================================================= */

router.put(
  "/:id/leave-balance",
  protect,
  authorize("admin"),
  updateLeaveBalance
);

/* =========================================================
   DELETE EMPLOYEE
========================================================= */

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteUser
);

module.exports = router;