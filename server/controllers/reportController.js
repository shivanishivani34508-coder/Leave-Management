const User = require("../models/UserTemp");
const Leave = require("../models/Leave");

/* ===========================================
   DETERMINE FINAL LEAVE STATUS
=========================================== */

const getLeaveStatus = (leave) => {
  /*
    If the leave already has a valid final status,
    use it directly.
  */

  if (
    leave.status === "Pending" ||
    leave.status === "Approved" ||
    leave.status === "Rejected" ||
    leave.status === "Cancelled"
  ) {
    return leave.status;
  }

  /*
    ------------------------------------------------
    OLD RECORDS WITHOUT STATUS
    ------------------------------------------------

    Check the approval workflow fields and determine
    the status for reports.
  */

  const requiredApprovals =
    Array.isArray(leave.requiredApprovals) &&
    leave.requiredApprovals.length > 0
      ? leave.requiredApprovals
      : ["Manager"];

  const approvalStatuses = {
    Manager: leave.managerStatus,
    DepartmentHead: leave.departmentHeadStatus,
    HR: leave.hrStatus,
    Admin: leave.adminStatus,
  };

  /*
    If any required approval is rejected,
    the leave is rejected.
  */

  const hasRejectedApproval = requiredApprovals.some(
    (approval) =>
      approvalStatuses[approval] === "Rejected"
  );

  if (hasRejectedApproval) {
    return "Rejected";
  }

  /*
    If every required approval is approved,
    the leave is approved.
  */

  const allApproved = requiredApprovals.every(
    (approval) =>
      approvalStatuses[approval] === "Approved"
  );

  if (allApproved) {
    return "Approved";
  }

  /*
    Otherwise the leave is still pending.
  */

  return "Pending";
};

/* ===========================================
   REPORT SUMMARY
=========================================== */

const getReportSummary = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({
      role: "employee",
    });

    const leaves = await Leave.find().lean();

    let approvedLeaves = 0;
    let pendingLeaves = 0;
    let rejectedLeaves = 0;

    leaves.forEach((leave) => {
      const status = getLeaveStatus(leave);

      if (status === "Approved") {
        approvedLeaves++;
      } else if (status === "Pending") {
        pendingLeaves++;
      } else if (status === "Rejected") {
        rejectedLeaves++;
      }
    });

    const totalLeaves = leaves.length;

    return res.status(200).json({
      totalEmployees,
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
    });
  } catch (error) {
    console.error("REPORT SUMMARY ERROR:", error);

    return res.status(500).json({
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
      .sort({ createdAt: -1 })
      .lean();

    /*
      Add a calculated status to every report.

      Existing correct status is preserved.

      Old records without status receive their
      status from the approval workflow.
    */

    const formattedReports = reports.map((leave) => ({
      ...leave,
      status: getLeaveStatus(leave),
    }));

    return res.status(200).json(formattedReports);
  } catch (error) {
    console.error("GET ALL REPORTS ERROR:", error);

    return res.status(500).json({
      message: "Failed to load reports.",
    });
  }
};

/* ===========================================
   EXPORT CONTROLLERS
=========================================== */

module.exports = {
  getReportSummary,
  getAllReports,
};