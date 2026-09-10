const Leave = require("../models/Leave");
console.log("***** HR CONTROLLER LOADED *****");

/* =========================================================
   HR DASHBOARD
========================================================= */

exports.getHRDashboard = async (req, res) => {
  try {
    const pending = await Leave.countDocuments({
      managerStatus: "Approved",
      departmentHeadStatus: "Approved",
      hrStatus: "Pending",
    });

    const approved = await Leave.countDocuments({
      hrStatus: "Approved",
    });

    const rejected = await Leave.countDocuments({
      hrStatus: "Rejected",
    });

    const total = await Leave.countDocuments();

    res.json({
      pending,
      approved,
      rejected,
      total,
    });

  } catch (error) {
    console.error("HR Dashboard Error:", error);

    res.status(500).json({
      message: "Failed to load HR dashboard",
    });
  }
};

/* =========================================================
   GET HR LEAVES
========================================================= */

exports.getHRLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({
      managerStatus: "Approved",
      departmentHeadStatus: "Approved",
    })
      .populate("employee", "name email department")
      .sort({ createdAt: -1 });

    res.json(leaves);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to fetch HR leave requests",
    });
  }
};

/* =========================================================
   HR APPROVAL
========================================================= */
exports.hrApproval = async (req, res) => {
  try {
    console.log("===== HR APPROVAL =====");
    console.log("Leave ID:", req.params.id);
    console.log("Status:", req.body.status);
    console.log("HR User:", req.user);

    const { status } = req.body;

    const leave = await Leave.findById(req.params.id);

    console.log("Leave Found:", leave);

    if (!leave) {
      return res.status(404).json({
        message: "Leave not found",
      });
    }

    leave.hrStatus = status;

    leave.approvedBy.hr = req.user._id;
    leave.approvedAt.hr = new Date();

    console.log("Saving leave...");

    await leave.save();

    console.log("Leave saved successfully.");

    res.json({
      message: `Leave ${status.toLowerCase()} successfully`,
      leave,
    });

  } catch (error) {
    console.error("HR APPROVAL ERROR:", error);

    res.status(500).json({
      message: error.message,
    });
  }
};