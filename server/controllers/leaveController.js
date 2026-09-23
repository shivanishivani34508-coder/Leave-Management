const Leave = require("../models/Leave");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Holiday = require("../models/Holiday");
const YearlyLeaveBalance = require("../models/YearlyLeaveBalance");
const sendEmail = require("../utils/sendEmail");

/* =========================================================
   CONFIGURATION
========================================================= */

const VALID_LEAVE_TYPES = [
  "Casual",
  "Sick",
  "Earned",
  "Marriage",
  "Maternity",
  "Paternity",
  "Bereavement",
  "Leave Without Pay",
];

const LEAVE_BALANCE_KEYS = {
  Casual: "casual",
  Sick: "sick",
  Earned: "earned",
  Marriage: "marriage",
  Maternity: "maternity",
  Paternity: "paternity",
  Bereavement: "bereavement",
};

/* =========================================================
   NORMALIZE DATE
========================================================= */

const normalizeDate = (dateValue) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};

/* =========================================================
   CALCULATE LEAVE DAYS
========================================================= */

const calculateLeaveDays = (startDate, endDate) => {
  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return (
    Math.floor(
      (endDate.getTime() -
        startDate.getTime()) /
        millisecondsPerDay
    ) + 1
  );
};

/* =========================================================
   GET LOGGED-IN USER ID
========================================================= */

const getLoggedInUserId = (req) => {
  return (
    req.user?.id ||
    req.user?._id
  );
};

/* =========================================================
   GET LEAVE YEAR
========================================================= */

const getLeaveYear = (dateValue) => {
  const date = normalizeDate(dateValue);

  if (!date) {
    return null;
  }

  return date.getUTCFullYear();
};
/* =========================================================
   CHECK WHETHER PENDING LEAVE HAS EXPIRED
   A Pending leave expires when its START DATE is
   today or has already passed.
========================================================= */

const isLeaveExpired = (startDate) => {
  const normalizedStartDate =
    normalizeDate(startDate);

  if (!normalizedStartDate) {
    return false;
  }

  const now = new Date();

  const today = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );

  return (
    normalizedStartDate.getTime() <=
    today.getTime()
  );
};

/* =========================================================
   RESTORE DEDUCTED LEAVE BALANCE
========================================================= */

const restoreDeductedLeaveBalance = async (
  leave
) => {
  if (
    !leave.balanceDeducted ||
    leave.leaveType === "Leave Without Pay"
  ) {
    return;
  }

  const balanceKey =
    LEAVE_BALANCE_KEYS[leave.leaveType];

  const leaveYear =
    getLeaveYear(leave.startDate);

  if (!balanceKey || !leaveYear) {
    return;
  }

  await YearlyLeaveBalance.findOneAndUpdate(
    {
      employee: leave.employee,
      year: leaveYear,
    },
    {
      $inc: {
        [`${balanceKey}.remaining`]:
          Number(leave.paidDays || 0),
        [`${balanceKey}.used`]:
          -Number(leave.paidDays || 0),
      },
    },
    {
      runValidators: true,
    }
  );
};

/* =========================================================
   DEDUCT LEAVE BALANCE AFTER FINAL APPROVAL
========================================================= */

const deductLeaveBalance = async (leave) => {
  console.log("========== DEDUCT LEAVE BALANCE ==========");
  console.log("Employee:", leave.employee);
  console.log("Leave Type:", leave.leaveType);
  console.log("Paid Days:", leave.paidDays);
  console.log("Balance Deducted Before:", leave.balanceDeducted);
  if (leave.leaveType === "Leave Without Pay") {
    return;
  }

  if (leave.balanceDeducted) {
    return;
  }

  const balanceKey =
    LEAVE_BALANCE_KEYS[leave.leaveType];

  const leaveYear =
    getLeaveYear(leave.startDate);

  const paidDays =
    Number(leave.paidDays || 0);

  if (
    !balanceKey ||
    !leaveYear ||
    paidDays <= 0
  ) {
    return;
  }

  const updatedBalance =
    await YearlyLeaveBalance.findOneAndUpdate(
      {
        employee: leave.employee,
        year: leaveYear,
        [`${balanceKey}.remaining`]: {
          $gte: paidDays,
        },
      },
     {
      $inc: {
        [`${balanceKey}.remaining`]: -paidDays,
        [`${balanceKey}.used`]: paidDays,
      },
    },
      {
        new: true,
        runValidators: true,
      }
    );

  if (!updatedBalance) {
    throw new Error(
      `Insufficient ${leave.leaveType} balance for final approval.`
    );
  }

  leave.balanceDeducted = true;
};

/* =========================================================
   NOTIFY APPROVER
========================================================= */

const notifyApprover = async ({
  approverId,
  employee,
  leave,
  title = "New Leave Request",
  message,
  emailSubject = "New Leave Request Submitted",
}) => {
  if (!approverId) {
    return;
  }

  const approver =
    await User.findById(approverId);

  if (!approver) {
    return;
  }

  await Notification.create({
    recipient: approver._id,
    sender: employee._id,
    title,
    message:
      message ||
      `${employee.name} applied for ${leave.leaveType} leave.`,
  });

  try {
    if (approver.email) {
      await sendEmail(
        approver.email,
        emailSubject,
        `
          <h2>New Leave Request</h2>

          <p>
            <strong>${employee.name}</strong>
            has applied for leave.
          </p>

          <p>
            <strong>Leave Type:</strong>
            ${leave.leaveType}
          </p>

          <p>
            <strong>Start Date:</strong>
            ${leave.startDate.toDateString()}
          </p>

          <p>
            <strong>End Date:</strong>
            ${leave.endDate.toDateString()}
          </p>

          <p>
            <strong>Total Days:</strong>
            ${leave.totalDays}
          </p>

          <p>
            <strong>Reason:</strong>
            ${leave.reason}
          </p>
        `
      );
    }
  } catch (emailError) {
    console.error(
      "APPROVER EMAIL ERROR:",
      emailError
    );
  }
};

/* =========================================================
   APPLY LEAVE
========================================================= */

const applyLeave = async (
  req,
  res
) => {
  try {
    const userId =
      getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        message:
          "Unauthorized. Please login again.",
      });
    }

    const {
      leaveType,
      startDate,
      endDate,
      reason,
      durationType,
      halfDaySession,
    } = req.body;

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      !leaveType ||
      !startDate ||
      !endDate ||
      !reason?.trim()
    ) {
      return res.status(400).json({
        message:
          "All fields are required.",
      });
    }

    /* =====================================================
       VALIDATE HALF DAY
    ===================================================== */

    if (
      durationType === "Half Day" &&
      !halfDaySession
    ) {
      return res.status(400).json({
        message:
          "Please select First Half or Second Half.",
      });
    }

    /* =====================================================
       VALIDATE LEAVE TYPE
    ===================================================== */

    if (
      !VALID_LEAVE_TYPES.includes(
        leaveType
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid leave type.",
      });
    }

    /* =====================================================
       VALIDATE REASON
    ===================================================== */

    const trimmedReason =
      reason.trim();

    if (
      trimmedReason.length < 5
    ) {
      return res.status(400).json({
        message:
          "Reason must contain at least 5 characters.",
      });
    }

    if (
      trimmedReason.length > 500
    ) {
      return res.status(400).json({
        message:
          "Reason cannot contain more than 500 characters.",
      });
    }

    /* =====================================================
       VALIDATE DATES
    ===================================================== */

    const start =
      normalizeDate(startDate);

    const end =
      normalizeDate(endDate);

    if (!start || !end) {
      return res.status(400).json({
        message:
          "Please provide valid start and end dates.",
      });
    }

    if (
      end.getTime() <
      start.getTime()
    ) {
      return res.status(400).json({
        message:
          "End date cannot be before start date.",
      });
    }

    /* =====================================================
       DO NOT ALLOW CROSS-YEAR LEAVE
    ===================================================== */

    const leaveYear =
      getLeaveYear(start);

    const endYear =
      getLeaveYear(end);

    if (
      leaveYear !== endYear
    ) {
      return res.status(400).json({
        message:
          "A leave request cannot span across two different years. Please submit separate leave requests.",
      });
    }
/* =====================================================
   CHECK COMPANY HOLIDAYS
===================================================== */

const holidays =
  await Holiday.find({
    holidayDate: {
      $gte: start,
      $lte: end,
    },
  });

const excludedHolidayDates =
  holidays.map(
    (holiday) =>
      normalizeDate(
        holiday.holidayDate
      )
  );

/* =====================================================
   EXCLUDE SUNDAYS
===================================================== */

let sundayCount = 0;

const currentDate = new Date(start);

while (
  currentDate.getTime() <= end.getTime()
) {
  // 0 = Sunday
  if (currentDate.getUTCDay() === 0) {
    sundayCount++;
  }

  currentDate.setUTCDate(
    currentDate.getUTCDate() + 1
  );
}

/* =====================================================
   CALCULATE REQUESTED DAYS
===================================================== */

let requestedDays =
  calculateLeaveDays(
    start,
    end
  );

if (
  durationType === "Half Day"
) {
  requestedDays = 0.5;
}

/* =====================================================
   TOTAL WORKING LEAVE DAYS
===================================================== */

const totalDays =
  requestedDays -
  excludedHolidayDates.length -
  sundayCount;
    /* =====================================================
       GET USER
    ===================================================== */

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message:
          "Employee not found.",
      });
    }

    /* =====================================================
       DETERMINE APPROVAL FLOW
    ===================================================== */

    let requiredApprovals = [
      "Manager",
    ];

    if (user.role === "manager") {
    requiredApprovals = [
      "DepartmentHead",
    ];
  }
    else if (
      user.role === "departmentHead"
    ) {
      requiredApprovals = [
        "HR",
      ];
    } else if (
      user.role === "hr"
    ) {
      requiredApprovals = [
        "Admin",
      ];
    } else if (
      user.role === "admin"
    ) {
      requiredApprovals = [
        "Admin",
      ];
    } else {
      if (
        totalDays > 2 &&
        totalDays <= 5
      ) {
        requiredApprovals = [
          "Manager",
          "DepartmentHead",
        ];
      } else if (
        totalDays > 5
      ) {
        requiredApprovals = [
          "Manager",
          "DepartmentHead",
          "HR",
        ];
      }
    }

    /* =====================================================
       ALL DAYS ARE HOLIDAYS
    ===================================================== */

    if (totalDays <= 0) {
      return res.status(400).json({
        message:
          "All selected dates are company holidays. Please select working days.",
      });
    }

    /* =====================================================
       DEBUG
    ===================================================== */

    console.log(
      "========== APPLY LEAVE USER DEBUG =========="
    );

    console.log(
      "User ID:",
      user._id
    );

    console.log(
      "User Name:",
      user.name
    );

    console.log(
      "User Role:",
      user.role
    );

    console.log(
      "User Department:",
      user.department
    );

    console.log(
      "User Manager:",
      user.manager
    );

    console.log(
      "User Department Head:",
      user.departmentHead
    );

    console.log(
      "User HR:",
      user.hr
    );

    console.log(
      "Required Approvals:",
      requiredApprovals
    );

    console.log(
      "============================================"
    );

    /* =====================================================
       CHECK OVERLAPPING LEAVE
    ===================================================== */

    const overlappingLeave =
      await Leave.findOne({
        employee: userId,

        status: {
          $in: [
            "Pending",
            "Approved",
          ],
        },

        startDate: {
          $lte: end,
        },

        endDate: {
          $gte: start,
        },
      });

    if (overlappingLeave) {
      return res.status(400).json({
        message:
          "You already have a leave request for the selected date range.",
      });
    }

    /* =====================================================
       CHECK YEARLY BALANCE
    ===================================================== */

    let paidDays = 0;
    let unpaidDays = 0;
    let balanceDeducted =
      false;

    if (
      leaveType ===
      "Leave Without Pay"
    ) {
      paidDays = 0;
      unpaidDays = totalDays;
    } else {
      const balanceKey =
        LEAVE_BALANCE_KEYS[
          leaveType
        ];

      if (!balanceKey) {
        return res.status(400).json({
          message:
            "Unable to determine leave balance type.",
        });
      }

      const yearlyLeaveBalance =
        await YearlyLeaveBalance.findOne({
          employee: userId,
          year: leaveYear,
        });

      if (!yearlyLeaveBalance) {
        return res.status(404).json({
          message:
            `No yearly leave balance found for ${leaveYear}.`,
        });
      }

      const leaveBalance =
        yearlyLeaveBalance[
          balanceKey
        ];

      if (!leaveBalance) {
        return res.status(400).json({
          message:
            `Leave balance for ${leaveType} was not found.`,
        });
      }

      const availableDays =
        Number(
          leaveBalance.remaining || 0
        );

      if (
        totalDays >
        availableDays
      ) {
        return res.status(400).json({
          message:
            `Insufficient ${leaveType} leave balance. Available: ${availableDays} days. Requested: ${totalDays} days.`,
        });
      }

      paidDays = totalDays;
      unpaidDays = 0;

      /* ===================================================
         IMPORTANT:
         DO NOT DEDUCT HERE.
         Deduction happens after final approval.
      =================================================== */

      balanceDeducted = false;
    }

    /* =====================================================
       CREATE LEAVE
    ===================================================== */

    const leave =
      await Leave.create({
        employee:
          user._id,

        department:
          user.department || "",

        leaveType,

        durationType,

        halfDaySession:
          halfDaySession ||
          undefined,

        startDate:
          start,

        endDate:
          end,

        excludedHolidayDates,

        reason:
          trimmedReason,

        totalDays,

        paidDays,

        unpaidDays,

        status:
          "Pending",

        requiredApprovals,

        managerStatus:
          "Pending",

        departmentHeadStatus:
          "Pending",

        hrStatus:
          "Pending",

        adminStatus:
          "Pending",

        balanceDeducted,
      });

    /* =====================================================
       FIND FIRST APPROVER
    ===================================================== */

    let firstApprover = null;

    if (
      requiredApprovals.includes(
        "Manager"
      )
    ) {
      firstApprover =
        user.manager;
    } else if (
      requiredApprovals.includes(
        "DepartmentHead"
      )
    ) {
      firstApprover =
        user.departmentHead;
    } else if (
      requiredApprovals.includes(
        "HR"
      )
    ) {
      firstApprover =
        user.hr;
    } else if (
      requiredApprovals.includes(
        "Admin"
      )
    ) {
      if (
        user.role !== "admin"
      ) {
        const admin =
          await User.findOne({
            role: "admin",
          });

        firstApprover =
          admin?._id || null;
      }
    }

    /* =====================================================
       NOTIFY FIRST APPROVER
    ===================================================== */

    if (
      firstApprover &&
      firstApprover.toString() !==
        user._id.toString()
    ) {
      await notifyApprover({
        approverId:
          firstApprover,

        employee:
          user,

        leave,

        title:
          "New Leave Request",

        message:
          `${user.name} applied for ${leaveType} leave.`,

        emailSubject:
          "New Leave Request Submitted",
      });
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      message:
        "Leave request submitted successfully.",

      leave,
    });
  } catch (error) {
    console.error(
      "APPLY LEAVE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while applying for leave.",
    });
  }
};

/* =========================================================
   GET MY LEAVES
========================================================= */

const getMyLeaves = async (req, res) => {
  try {
    const userId =
      getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        message:
          "Unauthorized. Please login again.",
      });
    }

    const leaves =
      await Leave.find({
        employee: userId,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json(
      leaves
    );
  } catch (error) {
    console.error(
      "GET MY LEAVES ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while loading your leave requests.",
    });
  }
};

/* =========================================================
   GET ALL LEAVES
   ADMIN ONLY
========================================================= */

const getAllLeaves = async (req, res) => {
  try {
    const leaves = (
      await Leave.find({
        status: { $ne: "Cancelled" },
      })
       .populate(
          "employee",
          "name email role department"
        )
        .sort({
          createdAt: -1,
        })
    ).filter(shouldDisplayLeave);

    return res.status(200).json(
      leaves
    );
  } catch (error) {
    console.error(
      "GET ALL LEAVES ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while loading employee leave requests.",
    });
  }
};

/* =========================================================
   CANCEL LEAVE
========================================================= */

const cancelLeave = async (req, res) => {
  try {
    console.log("========== CANCEL LEAVE CALLED ==========");
    console.log("Leave ID:", req.params.id);
    console.log("User:", req.user);
    const userId =
      getLoggedInUserId(req);

    if (!userId) {
      return res.status(401).json({
        message:
          "Unauthorized. Please login again.",
      });
    }

    const leave =
      await Leave.findById(
        req.params.id
      );

    if (!leave) {
      return res.status(404).json({
        message:
          "Leave request not found.",
      });
    }

    /* =====================================================
       ONLY OWNER CAN CANCEL
    ===================================================== */

    if (
      leave.employee.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to cancel this leave.",
      });
    }

    /* =====================================================
       ALREADY CANCELLED
    ===================================================== */

    if (
      leave.status === "Cancelled"
    ) {
      return res.status(400).json({
        message:
          "This leave has already been cancelled.",
      });
    }

    /* =====================================================
       REJECTED LEAVE CANNOT BE CANCELLED
    ===================================================== */

    if (
      leave.status === "Rejected"
    ) {
      return res.status(400).json({
        message:
          "Rejected leave cannot be cancelled.",
      });
    }

    /* =====================================================
       RESTORE DEDUCTED BALANCE
    ===================================================== */

    await restoreDeductedLeaveBalance(
      leave
    );

    leave.status = "Cancelled";

    leave.balanceDeducted = false;

    await leave.save();

    return res.status(200).json({
      message:
        "Leave cancelled successfully.",
      leave,
    });
  } catch (error) {
    console.error(
      "CANCEL LEAVE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while cancelling leave.",
    });
  }
};

const getTodayStart = () => {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
};

const isLeavePastEndDate = (endDate) => {
  const normalizedEndDate = normalizeDate(endDate);
  if (!normalizedEndDate) {
    return false;
  }
  const now = new Date();
  const today = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
  return normalizedEndDate.getTime() < today.getTime();
};

// A request is only hidden after its end date when no final decision was made.
// Approved and rejected requests remain available as leave history.
const shouldDisplayLeave = (leave) =>
  leave.status !== "Pending" ||
  !isLeavePastEndDate(leave.endDate);

/* =========================================================
   MANAGER - GET TEAM LEAVE REQUESTS
========================================================= */
const getManagerLeaves = async (req, res) => {
  try {
    const managerId = getLoggedInUserId(req);

    if (!managerId) {
      return res.status(401).json({
        message: "Unauthorized. Please login again.",
      });
    }

    const employees = await User.find({
      manager: managerId,
    }).select(
      "_id name email department role manager departmentHead"
    );

    const employeeIds = employees.map(
      (employee) => employee._id
    );

    const leaves = await Leave.find({
      employee: { $in: employeeIds },
      requiredApprovals: "Manager",
      status: { $ne: "Cancelled" },

      $or: [
        // Show leaves that are already processed
        { status: { $ne: "Pending" } },

        // Show Pending leaves only when their end date
        // is today or in the future
        {
          status: "Pending",
          endDate: { $gte: getTodayStart() },
        },
      ],
    })
      .populate(
        "employee",
        "name email department role"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json(leaves);
  } catch (error) {
    console.error(
      "GET MANAGER LEAVES ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while loading manager leave requests.",
    });
  }
};
/* =========================================================
   DEPARTMENT HEAD - GET LEAVE REQUESTS
========================================================= */

const getDepartmentHeadLeaves = async (
  req,
  res
) => {
  try {
    const departmentHeadId =
      getLoggedInUserId(req);

    if (!departmentHeadId) {
      return res.status(401).json({
        message:
          "Unauthorized. Please login again.",
      });
    }
    const departmentHeadUser = await User.findById(departmentHeadId);

    const deptHeadDepartment = (departmentHeadUser?.department || "").trim();
    const inferredDept = deptHeadDepartment || (
      departmentHeadUser?.name?.toLowerCase().includes("finance") ? "Finance" :
      departmentHeadUser?.name?.toLowerCase().includes("hr") ? "HR" :
      departmentHeadUser?.name?.toLowerCase().includes("it") ? "IT" :
      departmentHeadUser?.name?.toLowerCase().includes("marketing") ? "Marketing" :
      departmentHeadUser?.name?.toLowerCase().includes("sales") ? "Sales" : ""
    );

    const queryConditions = [
      { requiredApprovals: "DepartmentHead" },
    ];

    if (inferredDept) {
      queryConditions.push({
        department: { $regex: new RegExp(`^${inferredDept}$`, "i") },
      });
    }

    const leaves = await Leave.find({
      status: { $ne: "Cancelled" },
      $or: queryConditions,
    })
      .populate(
        "employee",
        "name email department role departmentHead hr manager"
      )
      .sort({
        createdAt: -1,
      });

    const assignedLeaves =
      leaves.filter(
        (leave) => {
          if (!leave.employee) {
            return false;
          }

          const isDirectlyAssigned =
            leave.employee.departmentHead &&
            leave.employee.departmentHead.toString() ===
              departmentHeadId.toString();

          const isSameDepartment = inferredDept && (
            (leave.employee.department &&
              leave.employee.department.trim().toLowerCase() ===
                inferredDept.toLowerCase()) ||
            (leave.department &&
              leave.department.trim().toLowerCase() ===
                inferredDept.toLowerCase())
          );

          const isManagerOf =
            leave.employee.manager &&
            leave.employee.manager.toString() ===
              departmentHeadId.toString();

          return (
            isDirectlyAssigned ||
            Boolean(isSameDepartment) ||
            isManagerOf
          );
        }
      );

    console.log(
      "======================================"
    );

    console.log(
      "DEPARTMENT HEAD DEBUG"
    );

    console.log(
      "Department Head ID:",
      departmentHeadId
    );

    console.log(
      "Assigned Leaves:",
      assignedLeaves.length
    );

    console.log(
      "Pending DH Leaves:",
      assignedLeaves.filter(
        (leave) =>
          leave.departmentHeadStatus ===
          "Pending"
      ).length
    );

    console.log(
      "Processed DH Leaves:",
      assignedLeaves.filter(
        (leave) =>
          leave.departmentHeadStatus !==
          "Pending"
      ).length
    );

    console.log(
      "======================================"
    );

    return res.status(200).json(
      assignedLeaves
    );
  } catch (error) {
    console.error(
      "GET DEPARTMENT HEAD LEAVES ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while loading department leave requests.",
    });
  }
};

/* =========================================================
   MANAGER APPROVAL
========================================================= */

const managerApproval = async (
  req,
  res
) => {
  try {
    const { status } =
      req.body;

    if (
      !["Approved", "Rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be Approved or Rejected.",
      });
    }

    const managerId =
      getLoggedInUserId(req);

    if (!managerId) {
      return res.status(401).json({
        message:
          "Unauthorized. Please login again.",
      });
    }

    const leave =
      await Leave.findById(
        req.params.id
      );

    if (!leave) {
      return res.status(404).json({
        message:
          "Leave request not found.",
      });
    }

    if (
      !leave.requiredApprovals.includes(
        "Manager"
      )
    ) {
      return res.status(400).json({
        message:
          "Manager approval is not required for this leave.",
      });
    }

    const employee =
      await User.findById(
        leave.employee
      );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found.",
      });
    }

    if (
      !employee.manager ||
      employee.manager.toString() !==
        managerId.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to review this employee's leave.",
      });
    }

    if (leave.status === "Cancelled") {
      return res.status(400).json({
        message:
          "This leave request was cancelled by the employee and cannot be approved or rejected.",
      });
    }
    if (
  leave.status === "Pending" &&
  isLeaveExpired(leave.startDate)
) {
  return res.status(400).json({
    message:
      "This leave request has expired and can no longer be approved or rejected.",
  });
}

    if (
      leave.managerStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        message:
          "Manager has already reviewed this leave.",
      });
    }

    /* =====================================================
       MANAGER REJECTS
    ===================================================== */

    if (
      status === "Rejected"
    ) {
      leave.managerStatus =
        "Rejected";

      leave.status =
        "Rejected";

      await restoreDeductedLeaveBalance(
        leave
      );

      leave.balanceDeducted =
        false;

      await leave.save();

      try {
        if (employee.email) {
          await sendEmail(
            employee.email,
            "Leave Request Rejected by Manager",
            `
              <h2>Leave Request Rejected</h2>

              <p>
                Hello <strong>${employee.name}</strong>,
              </p>

              <p>
                Your leave request has been
                <strong>REJECTED</strong>
                by the Manager.
              </p>

              <p>
                <strong>Leave Type:</strong>
                ${leave.leaveType}
              </p>

              <p>
                <strong>Start Date:</strong>
                ${leave.startDate.toDateString()}
              </p>

              <p>
                <strong>End Date:</strong>
                ${leave.endDate.toDateString()}
              </p>

              <p>
                <strong>Total Days:</strong>
                ${leave.totalDays}
              </p>
            `
          );
        }
      } catch (emailError) {
        console.error(
          "MANAGER REJECTION EMAIL ERROR:",
          emailError
        );
      }

      return res.status(200).json({
        message:
          "Leave rejected by Manager.",
        leave,
      });
    }

    /* =====================================================
       MANAGER APPROVES
    ===================================================== */

    leave.managerStatus =
      "Approved";

    leave.approvedBy.manager =
      managerId;

    leave.approvedAt.manager =
      new Date();

    /* =====================================================
       DETERMINE NEXT LEVEL
    ===================================================== */

    if (
      leave.requiredApprovals.includes(
        "DepartmentHead"
      )
    ) {
      leave.departmentHeadStatus =
        "Pending";

      leave.status =
        "Pending";
    } else if (
      leave.requiredApprovals.includes(
        "HR"
      )
    ) {
      leave.hrStatus =
        "Pending";

      leave.status =
        "Pending";
    } else {
      leave.status =
        "Approved";

      // Manager is final approver.
      await deductLeaveBalance(
        leave
      );
    }

    await leave.save();

    /* =====================================================
       NOTIFY DEPARTMENT HEAD
    ===================================================== */

    if (
      leave.status === "Pending" &&
      leave.requiredApprovals.includes(
        "DepartmentHead"
      )
    ) {
      const departmentHead =
        employee.departmentHead
          ? await User.findById(
              employee.departmentHead
            )
          : null;

      if (departmentHead) {
        await notifyApprover({
          approverId:
            departmentHead._id,

          employee,

          leave,

          title:
            "Leave Request Requires Department Head Approval",

          message:
            `${employee.name}'s leave request has been approved by the Manager and requires your approval.`,

          emailSubject:
            "Leave Request Requires Department Head Approval",
        });
      }
    }

    return res.status(200).json({
      message:
        leave.status === "Approved"
          ? "Leave approved successfully by Manager."
          : "Leave approved by Manager and forwarded to the next approval level.",

      leave,
    });
  } catch (error) {
    console.error(
      "MANAGER APPROVAL ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while processing manager approval.",
    });
  }
};

/* =========================================================
   DEPARTMENT HEAD APPROVAL
========================================================= */

const departmentHeadApproval = async (req,res) => {
  try {
    const { status } =
      req.body;

    if (
      !["Approved", "Rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be Approved or Rejected.",
      });
    }

    const leave =
      await Leave.findById(
        req.params.id
      );

    if (!leave) {
      return res.status(404).json({
        message:
          "Leave request not found.",
      });
    }

    if (leave.status === "Cancelled") {
  return res.status(400).json({
    message:
      "This leave request was cancelled by the employee and cannot be approved or rejected.",
  });
}

if (
  leave.status === "Pending" &&
  isLeaveExpired(leave.startDate)
) {
  return res.status(400).json({
    message:
      "This leave request has expired and can no longer be approved or rejected.",
  });
}

    if (
      !leave.requiredApprovals.includes(
        "DepartmentHead"
      )
    ) {
      return res.status(400).json({
        message:
          "Department Head approval is not required for this leave.",
      });
    }

    const employee =
      await User.findById(
        leave.employee
      );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found.",
      });
    }

    const departmentHeadId =
      getLoggedInUserId(req);

    const departmentHeadUser =
      await User.findById(departmentHeadId);

    const deptHeadDepartment = (departmentHeadUser?.department || "").trim();
    const inferredDept = deptHeadDepartment || (
      departmentHeadUser?.name?.toLowerCase().includes("finance") ? "Finance" :
      departmentHeadUser?.name?.toLowerCase().includes("hr") ? "HR" :
      departmentHeadUser?.name?.toLowerCase().includes("it") ? "IT" :
      departmentHeadUser?.name?.toLowerCase().includes("marketing") ? "Marketing" :
      departmentHeadUser?.name?.toLowerCase().includes("sales") ? "Sales" : ""
    );

    const isDirectlyAssigned =
      employee.departmentHead &&
      employee.departmentHead.toString() ===
        departmentHeadId.toString();

    const isSameDepartment = inferredDept && (
      (employee.department &&
        employee.department.trim().toLowerCase() ===
          inferredDept.toLowerCase()) ||
      (leave.department &&
        leave.department.trim().toLowerCase() ===
          inferredDept.toLowerCase())
    );

    const isManagerOf =
      employee.manager &&
      employee.manager.toString() ===
        departmentHeadId.toString();

    if (!isDirectlyAssigned && !isSameDepartment && !isManagerOf) {
      return res.status(403).json({
        message:
          "You are not authorized to review this employee's leave.",
      });
    }

    if (
      leave.requiredApprovals.includes(
        "Manager"
      ) &&
      leave.managerStatus !==
        "Approved"
    ) {
      return res.status(400).json({
        message:
          "Manager approval is required before Department Head approval.",
      });
    }

    if (
      leave.departmentHeadStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        message:
          "Department Head has already reviewed this leave.",
      });
    }

    /* =====================================================
       DEPARTMENT HEAD REJECTS
    ===================================================== */

    if (
      status === "Rejected"
    ) {
      leave.departmentHeadStatus =
        "Rejected";

      leave.status =
        "Rejected";

      await restoreDeductedLeaveBalance(
        leave
      );

      leave.balanceDeducted =
        false;

      await leave.save();

      try {
        if (employee.email) {
          await sendEmail(
            employee.email,
            "Leave Request Rejected by Department Head",
            `
              <h2>Leave Request Rejected</h2>

              <p>
                Hello <strong>${employee.name}</strong>,
              </p>

              <p>
                Your leave request has been
                <strong>REJECTED</strong> by the Department Head.
              </p>

              <p>
                <strong>Leave Type:</strong>
                ${leave.leaveType}
              </p>

              <p>
                <strong>Start Date:</strong>
                ${leave.startDate.toDateString()}
              </p>

              <p>
                <strong>End Date:</strong>
                ${leave.endDate.toDateString()}
              </p>

              <p>
                <strong>Total Days:</strong>
                ${leave.totalDays}
              </p>
            `
          );
        }
      } catch (emailError) {
        console.error(
          "DEPARTMENT HEAD REJECTION EMAIL ERROR:",
          emailError
        );
      }

      return res.status(200).json({
        message:
          "Leave rejected by Department Head.",
        leave,
      });
    }

    /* =====================================================
       DEPARTMENT HEAD APPROVES
    ===================================================== */

    leave.departmentHeadStatus =
      "Approved";

    leave.approvedBy.departmentHead =
      departmentHeadId;

    leave.approvedAt.departmentHead =
      new Date();

    if (
      leave.requiredApprovals.includes(
        "HR"
      )
    ) {
      leave.hrStatus =
        "Pending";

      leave.status =
        "Pending";
    } else {
      leave.status =
        "Approved";

      // Department Head is final approver.
      await deductLeaveBalance(
        leave
      );
    }

    await leave.save();

    /* =====================================================
       NOTIFY HR
    ===================================================== */

    if (
      leave.requiredApprovals.includes(
        "HR"
      ) &&
      leave.status === "Pending"
    ) {
      const hrUsers =
        await User.find({
          role: "hr",
        });

      for (const hrUser of hrUsers) {
        await Notification.create({
          recipient: hrUser._id,
          sender: employee._id,
          title:
            "Leave Request Requires HR Approval",
          message:
            `${employee.name}'s leave request has been approved by the Department Head and requires your approval.`,
        });

        try {
          if (hrUser.email) {
            await sendEmail(
              hrUser.email,
              "Leave Request Requires HR Approval",
              `
                <h2>Leave Request Requires HR Approval</h2>

                <p>
                  <strong>${employee.name}</strong>'s
                  leave request has been approved by the
                  Department Head and requires your approval.
                </p>

                <p>
                  <strong>Leave Type:</strong>
                  ${leave.leaveType}
                </p>

                <p>
                  <strong>Start Date:</strong>
                  ${leave.startDate.toDateString()}
                </p>

                <p>
                  <strong>End Date:</strong>
                  ${leave.endDate.toDateString()}
                </p>

                <p>
                  <strong>Total Days:</strong>
                  ${leave.totalDays}
                </p>
              `
            );
          }
        } catch (emailError) {
          console.error(
            "HR NOTIFICATION EMAIL ERROR:",
            emailError
          );
        }
      }
    }

    /* =====================================================
       FINAL APPROVAL EMAIL
    ===================================================== */

    if (
      leave.status === "Approved"
    ) {
      try {
        if (employee.email) {
          await sendEmail(
            employee.email,
            "Leave Request Approved",
            `
              <h2>Leave Request Approved</h2>

              <p>
                Hello <strong>${employee.name}</strong>,
              </p>

              <p>
                Your leave request has been
                <strong>APPROVED</strong>.
              </p>

              <p>
                <strong>Leave Type:</strong>
                ${leave.leaveType}
              </p>

              <p>
                <strong>Start Date:</strong>
                ${leave.startDate.toDateString()}
              </p>

              <p>
                <strong>End Date:</strong>
                ${leave.endDate.toDateString()}
              </p>

              <p>
                <strong>Total Days:</strong>
                ${leave.totalDays}
              </p>
            `
          );
        }
      } catch (emailError) {
        console.error(
          "DEPARTMENT HEAD APPROVAL EMAIL ERROR:",
          emailError
        );
      }
    }

    return res.status(200).json({
      message:
        leave.status === "Approved"
          ? "Leave approved successfully by Department Head."
          : "Leave approved by Department Head and forwarded to HR.",

      leave,
    });
  } catch (error) {
    console.error(
      "DEPARTMENT HEAD APPROVAL ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while processing Department Head approval.",
    });
  }
};
/* =========================================================
   HR - GET LEAVES
========================================================= */

const getHRLeaves = async (req, res) => {
  try {
    const hrId =
      getLoggedInUserId(req);

    if (!hrId) {
      return res.status(401).json({
        message:
          "Unauthorized. Please login again.",
      });
    }

    const leaves =
      await Leave.find({
        requiredApprovals: "HR",

        employee: {
          $ne: hrId,
        },

            status: {
      $ne: "Cancelled",
    },


        $or: [
          {
            departmentHeadStatus:
              "Approved",
          },

          {
            requiredApprovals: {
              $ne: "DepartmentHead",
            },
          },
        ],
      })
        .populate(
          "employee",
          "name email department role departmentHead hr"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json(
      leaves.filter(shouldDisplayLeave)
    );
  } catch (error) {
    console.error(
      "GET HR LEAVES ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while loading HR leave requests.",
    });
  }
};

/* =========================================================
   HR APPROVAL
========================================================= */

const hrApproval = async (
  req,
  res
) => {
  try {
    const { status } =
      req.body;

    if (
      !["Approved", "Rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be Approved or Rejected.",
      });
    }

    const leave =
      await Leave.findById(
        req.params.id
      );

    if (!leave) {
      return res.status(404).json({
        message:
          "Leave request not found.",
      });
    }

    if (leave.status === "Cancelled") {
  return res.status(400).json({
    message:
      "This leave request was cancelled by the employee and cannot be approved or rejected.",
  });
}
if (
  leave.status === "Pending" &&
  isLeaveExpired(leave.startDate)
) {
  return res.status(400).json({
    message:
      "This leave request has expired and can no longer be approved or rejected.",
  });
}

    if (
      !leave.requiredApprovals.includes(
        "HR"
      )
    ) {
      return res.status(400).json({
        message:
          "HR approval is not required for this leave.",
      });
    }

    const employee =
      await User.findById(
        leave.employee
      );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found.",
      });
    }

    const hrId =
      getLoggedInUserId(req);

    /* =====================================================
       HR CANNOT APPROVE OWN LEAVE
    ===================================================== */

    if (
      employee._id.toString() ===
      hrId.toString()
    ) {
      return res.status(403).json({
        message:
          "You cannot approve your own leave. Admin approval is required.",
      });
    }

    if (
      leave.requiredApprovals.includes(
        "Manager"
      ) &&
      leave.managerStatus !==
        "Approved"
    ) {
      return res.status(400).json({
        message:
          "Manager approval is required before HR approval.",
      });
    }

    if (
      leave.requiredApprovals.includes(
        "DepartmentHead"
      ) &&
      leave.departmentHeadStatus !==
        "Approved"
    ) {
      return res.status(400).json({
        message:
          "Department Head approval is required before HR approval.",
      });
    }

    if (
      leave.hrStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        message:
          "HR has already reviewed this leave.",
      });
    }

    /* =====================================================
       HR REJECTS
    ===================================================== */

    if (
      status === "Rejected"
    ) {
      leave.hrStatus =
        "Rejected";

      leave.status =
        "Rejected";

      await restoreDeductedLeaveBalance(
        leave
      );

      leave.balanceDeducted =
        false;

      await leave.save();

      try {
        if (employee.email) {
          await sendEmail(
            employee.email,
            "Leave Request Rejected by HR",
            `
              <h2>Leave Request Rejected</h2>

              <p>
                Hello <strong>${employee.name}</strong>,
              </p>

              <p>
                Your leave request has been
                <strong>REJECTED</strong> by HR.
              </p>

              <p>
                <strong>Leave Type:</strong>
                ${leave.leaveType}
              </p>

              <p>
                <strong>Start Date:</strong>
                ${leave.startDate.toDateString()}
              </p>

              <p>
                <strong>End Date:</strong>
                ${leave.endDate.toDateString()}
              </p>

              <p>
                <strong>Total Days:</strong>
                ${leave.totalDays}
              </p>
            `
          );
        }
      } catch (emailError) {
        console.error(
          "HR REJECTION EMAIL ERROR:",
          emailError
        );
      }

      return res.status(200).json({
        message:
          "Leave rejected by HR.",
        leave,
      });
    }

    /* =====================================================
       HR APPROVES
    ===================================================== */

    leave.hrStatus =
      "Approved";

    leave.approvedBy.hr =
      hrId;

    leave.approvedAt.hr =
      new Date();

    if (
      leave.requiredApprovals.includes(
        "Admin"
      )
    ) {
      leave.adminStatus =
        "Pending";

      leave.status =
        "Pending";
    } else {
      leave.status =
        "Approved";

      // HR is the final approver.
      await deductLeaveBalance(
        leave
      );
    }

    await leave.save();

    /* =====================================================
       ADMIN FINAL APPROVAL REQUIRED
    ===================================================== */

    if (
      leave.requiredApprovals.includes(
        "Admin"
      )
    ) {
      const admins =
        await User.find({
          role: "admin",
        });

      for (const admin of admins) {
        await Notification.create({
          recipient: admin._id,
          sender: employee._id,
          title:
            "Leave Request Requires Admin Approval",
          message:
            `${employee.name}'s leave request requires your final approval.`,
        });

        try {
          if (admin.email) {
            await sendEmail(
              admin.email,
              "Leave Request Requires Admin Approval",
              `
                <h2>
                  Leave Request Requires Admin Approval
                </h2>

                <p>
                  <strong>${employee.name}</strong>'s
                  leave request requires your final approval.
                </p>

                <p>
                  <strong>Leave Type:</strong>
                  ${leave.leaveType}
                </p>

                <p>
                  <strong>Start Date:</strong>
                  ${leave.startDate.toDateString()}
                </p>

                <p>
                  <strong>End Date:</strong>
                  ${leave.endDate.toDateString()}
                </p>

                <p>
                  <strong>Total Days:</strong>
                  ${leave.totalDays}
                </p>
              `
            );
          }
        } catch (emailError) {
          console.error(
            "ADMIN NOTIFICATION EMAIL ERROR:",
            emailError
          );
        }
      }
    } else {
      try {
        if (employee.email) {
          await sendEmail(
            employee.email,
            "Leave Request Approved by HR",
            `
              <h2>Leave Request Approved</h2>

              <p>
                Hello <strong>${employee.name}</strong>,
              </p>

              <p>
                Your leave request has been
                <strong>APPROVED</strong> by HR.
              </p>

              <p>
                <strong>Leave Type:</strong>
                ${leave.leaveType}
              </p>

              <p>
                <strong>Start Date:</strong>
                ${leave.startDate.toDateString()}
              </p>

              <p>
                <strong>End Date:</strong>
                ${leave.endDate.toDateString()}
              </p>

              <p>
                <strong>Total Days:</strong>
                ${leave.totalDays}
              </p>
            `
          );
        }
      } catch (emailError) {
        console.error(
          "HR APPROVAL EMAIL ERROR:",
          emailError
        );
      }
    }

    return res.status(200).json({
      message:
        leave.status === "Approved"
          ? "Leave approved successfully by HR."
          : "Leave approved by HR and forwarded to Admin for final approval.",

      leave,
    });
  } catch (error) {
    console.error(
      "HR APPROVAL ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while processing HR approval.",
    });
  }
};

/* =========================================================
   ADMIN APPROVAL
   Used ONLY when Admin is included in requiredApprovals.
========================================================= */

const adminApproval = async (
  req,
  res
) => {
  try {
    const { status } =
      req.body;

    if (
      !["Approved", "Rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be Approved or Rejected.",
      });
    }

    const leave =
      await Leave.findById(
        req.params.id
      );

    if (!leave) {
      return res.status(404).json({
        message:
          "Leave request not found.",
      });
    }

    if (
      !leave.requiredApprovals.includes(
        "Admin"
      )
    ) {
      return res.status(400).json({
        message:
          "Admin approval is not required for this leave.",
      });
    }

    if (
      leave.adminStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        message:
          "Admin has already reviewed this leave.",
      });
    }

    const adminId =
      getLoggedInUserId(req);

    const employee =
      await User.findById(
        leave.employee
      );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found.",
      });
    }

    /* =====================================================
       ADMIN REJECTS
    ===================================================== */

    if (
      status === "Rejected"
    ) {
      leave.adminStatus =
        "Rejected";

      leave.status =
        "Rejected";

      await restoreDeductedLeaveBalance(
        leave
      );

      leave.balanceDeducted =
        false;

      await leave.save();

      try {
        if (employee.email) {
          await sendEmail(
            employee.email,
            "Leave Request Rejected by Admin",
            `
              <h2>Leave Request Rejected</h2>

              <p>
                Hello <strong>${employee.name}</strong>,
              </p>

              <p>
                Your leave request has been
                <strong>REJECTED</strong> by Admin.
              </p>

              <p>
                <strong>Leave Type:</strong>
                ${leave.leaveType}
              </p>

              <p>
                <strong>Start Date:</strong>
                ${leave.startDate.toDateString()}
              </p>

              <p>
                <strong>End Date:</strong>
                ${leave.endDate.toDateString()}
              </p>

              <p>
                <strong>Total Days:</strong>
                ${leave.totalDays}
              </p>
            `
          );
        }
      } catch (emailError) {
        console.error(
          "ADMIN REJECTION EMAIL ERROR:",
          emailError
        );
      }

      return res.status(200).json({
        message:
          "Leave rejected by Admin.",
        leave,
      });
    }

    /* =====================================================
       ADMIN APPROVES
    ===================================================== */

    leave.adminStatus =
      "Approved";

    leave.approvedBy.admin =
      adminId;

    leave.approvedAt.admin =
      new Date();

    leave.status =
      "Approved";

    // Admin is the final approver.
    await deductLeaveBalance(
      leave
    );

    await leave.save();

    try {
      if (employee.email) {
        await sendEmail(
          employee.email,
          "Leave Request Approved by Admin",
          `
            <h2>Leave Request Approved</h2>

            <p>
              Hello <strong>${employee.name}</strong>,
            </p>

            <p>
              Your leave request has been
              <strong>APPROVED</strong> by Admin.
            </p>

            <p>
              <strong>Leave Type:</strong>
              ${leave.leaveType}
            </p>

            <p>
              <strong>Start Date:</strong>
              ${leave.startDate.toDateString()}
            </p>

            <p>
              <strong>End Date:</strong>
              ${leave.endDate.toDateString()}
            </p>

            <p>
              <strong>Total Days:</strong>
              ${leave.totalDays}
            </p>
          `
        );
      }
    } catch (emailError) {
      console.error(
        "ADMIN APPROVAL EMAIL ERROR:",
        emailError
      );
    }

    return res.status(200).json({
      message:
        "Leave approved successfully by Admin.",
      leave,
    });
  } catch (error) {
    console.error(
      "ADMIN APPROVAL ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while processing Admin approval.",
    });
  }
};

/* =========================================================
   OLD ADMIN STATUS ENDPOINT
   Kept for compatibility.
========================================================= */

const updateLeaveStatus = async (
  req,
  res
) => {
  try {
    const { status } =
      req.body;

    if (
      !["Approved", "Rejected"].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be Approved or Rejected.",
      });
    }

    const leave =
      await Leave.findById(
        req.params.id
      );

    if (!leave) {
      return res.status(404).json({
        message:
          "Leave request not found.",
      });
    }

    if (
      !leave.requiredApprovals.includes(
        "Admin"
      )
    ) {
      return res.status(400).json({
        message:
          "Admin approval is not required for this leave.",
      });
    }

    if (
      leave.adminStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        message:
          "Admin has already reviewed this leave.",
      });
    }

    const adminId =
      getLoggedInUserId(req);

    const employee =
      await User.findById(
        leave.employee
      );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found.",
      });
    }

    if (
      status === "Rejected"
    ) {
      leave.adminStatus =
        "Rejected";

      leave.status =
        "Rejected";

      await restoreDeductedLeaveBalance(
        leave
      );

      leave.balanceDeducted =
        false;

      await leave.save();

      return res.status(200).json({
        message:
          "Leave rejected by Admin.",
        leave,
      });
    }

    leave.adminStatus =
      "Approved";

    leave.approvedBy.admin =
      adminId;

    leave.approvedAt.admin =
      new Date();

    leave.status =
      "Approved";

    // Admin is the final approver.
    await deductLeaveBalance(
      leave
    );

    await leave.save();

    return res.status(200).json({
      message:
        "Leave approved successfully by Admin.",
      leave,
    });
  } catch (error) {
    console.error(
      "UPDATE LEAVE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server error while updating leave status.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  cancelLeave,

  getManagerLeaves,
  managerApproval,

  getDepartmentHeadLeaves,
  departmentHeadApproval,

  getHRLeaves,
  hrApproval,

  adminApproval,
  updateLeaveStatus,
};
