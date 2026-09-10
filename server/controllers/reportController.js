const User = require("../models/User");
const Leave = require("../models/Leave");

/* ===========================================
   REPORT SUMMARY
=========================================== */

const getReportSummary = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({
      role: "employee",
    });

    const totalLeaves = await Leave.countDocuments();

    const approvedLeaves = await Leave.countDocuments({
      status: "Approved",
    });

    const pendingLeaves = await Leave.countDocuments({
      status: "Pending",
    });

    const rejectedLeaves = await Leave.countDocuments({
      status: "Rejected",
    });

    res.status(200).json({
      totalEmployees,
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load report summary.",
    });
  }
};

/* ===========================================
   ALL LEAVE REPORTS
=========================================== */

const getAllReports = async (req, res) => {
  try {
    const reports = await Leave.find()
      .populate("employee", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to load reports.",
    });
  }
};

module.exports = {
  getReportSummary,
  getAllReports,
};