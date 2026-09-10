const express = require("express");

const router = express.Router();

const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorize,
} = require("../middleware/roleMiddleware");

const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

/* =========================================================
   GET ALL DEPARTMENTS
========================================================= */

router.get(
  "/",
  protect,
  getDepartments
);

/* =========================================================
   CREATE DEPARTMENT
   ADMIN ONLY
========================================================= */

router.post(
  "/",
  protect,
  authorize("admin"),
  createDepartment
);

/* =========================================================
   UPDATE DEPARTMENT
   ADMIN ONLY
========================================================= */

router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateDepartment
);

/* =========================================================
   DELETE DEPARTMENT
   ADMIN ONLY
========================================================= */

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteDepartment
);

module.exports = router;