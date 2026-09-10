const express = require("express");

const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const {
  getHRDashboard,
  getHRLeaves,
  hrApproval,
} = require("../controllers/hrController");

/* ======================================================
   HR DASHBOARD
====================================================== */

router.get(
  "/dashboard",
  protect,
  authorize("hr"),
  getHRDashboard
);

/* ======================================================
   HR LEAVE REQUESTS
====================================================== */

router.get(
  "/leaves",
  protect,
  authorize("hr"),
  getHRLeaves
);

/* ======================================================
   APPROVE / REJECT
====================================================== */

router.put(
  "/:id",
  protect,
  authorize("hr"),
  hrApproval
);

module.exports = router;