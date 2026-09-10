const express = require("express");

const router = express.Router();

const {
  getReportSummary,
  getAllReports,
} = require("../controllers/reportController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/* ===========================================
   REPORT SUMMARY
=========================================== */

router.get(
  "/summary",
  protect,
  authorize("admin"),
  getReportSummary
);

/* ===========================================
   ALL REPORTS
=========================================== */

router.get(
  "/all",
  protect,
  authorize("admin"),
  getAllReports
);

module.exports = router;