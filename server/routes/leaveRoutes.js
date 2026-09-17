const express = require("express");
const {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  getAllLeaves,
  getManagerLeaves,
  getDepartmentHeadLeaves,
  getHRLeaves,
  updateLeaveStatus,
  managerApproval,
  departmentHeadApproval,
  hrApproval,
  adminApproval,
} = require("../controllers/leaveController");
const {
  protect,
} = require("../middleware/authMiddleware");

const {
  authorize,
} = require("../middleware/roleMiddleware");

const router = express.Router();

/* =========================================================
   EMPLOYEE ROUTES
========================================================= */

/*
  POST /api/leaves

  Employee submits a new leave request.
*/
router.post(
  "/",
  protect,
  authorize(
    "employee",
    "manager",
    "departmentHead",
    "hr",
    "admin"
  ),
  applyLeave
);


/*
  GET /api/leaves/my

  Employee views only their own leave requests.
*/

router.get(
  "/my",
  protect,
  authorize(
  "employee",
  "manager",
  "departmentHead",
  "hr",
  "admin"
),  getMyLeaves
);

/* =========================================================
   ADMIN ROUTES
========================================================= */

/*
  GET /api/leaves

  Admin views all employee leave requests.
*/

router.get(
  "/",
  protect,
  authorize("admin"),
  getAllLeaves
);



/*
  PUT /api/leaves/:id/status

  Admin approves or rejects a Pending leave request.
*/

router.put(
  "/:id/status",
  protect,
  authorize("admin"),
  updateLeaveStatus
);

/* =========================================================
   MANAGER APPROVAL
========================================================= */

router.put(
  "/:id/manager",
  protect,
  authorize("manager"),
  managerApproval
);

/* =========================================================
   MANAGER - GET TEAM LEAVE REQUESTS
========================================================= */

router.get(
  "/manager",
  protect,
  authorize("manager"),
  getManagerLeaves
);

router.get(
  "/department-head",
  protect,
  authorize("departmentHead"),
  getDepartmentHeadLeaves
);
/* =========================================================
   DEPARTMENT HEAD APPROVAL
========================================================= */

router.put(
  "/:id/department-head",
  protect,
  authorize("departmentHead"),
  departmentHeadApproval
);


router.get(
  "/hr",
  protect,
  authorize("hr"),
  getHRLeaves
);
/* =========================================================
   HR APPROVAL
========================================================= */

router.put(
  "/:id/hr",
  protect,
  authorize("hr"),
  hrApproval
);

/* =========================================================
   ADMIN FINAL APPROVAL
========================================================= */

router.put(
  "/:id/admin",
  protect,
  authorize("admin"),
  adminApproval
);

/* =========================================================
   EMPLOYEE CANCEL ROUTE
========================================================= */

/*
  DELETE /api/leaves/:id

  Employee can cancel only their own Pending leave request.

  IMPORTANT:
  Keep this route after the more specific routes above.
*/

router.delete(
  "/:id",
  protect,
  authorize(
  "employee",
  "manager",
  "departmentHead",
  "hr"
),  cancelLeave
);

module.exports = router;