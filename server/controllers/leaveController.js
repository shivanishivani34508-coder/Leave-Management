const Leave = require("../models/Leave");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Holiday = require("../models/Holiday");
const YearlyLeaveBalance = require(
  "../models/YearlyLeaveBalance"
);

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

const calculateLeaveDays = (
  startDate,
  endDate
) => {
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
   GET AVAILABLE BALANCE
========================================================= */

const getAvailableBalance = (
  user,
  leaveType
) => {
  if (
    leaveType ===
    "Leave Without Pay"
  ) {
    return 0;
  }

  const balanceKey =
    LEAVE_BALANCE_KEYS[
      leaveType
    ];

  if (!balanceKey) {
    return 0;
  }

  return Number(
    user.leaveBalances?.[
      balanceKey
    ] ?? 0
  );
};

/* =========================================================
   RESTORE A RESERVED LEAVE BALANCE
========================================================= */

const restoreDeductedLeaveBalance = async (leave) => {
  if (
    !leave.balanceDeducted ||
    leave.leaveType === "Leave Without Pay"
  ) {
    return;
  }

  const balanceKey = LEAVE_BALANCE_KEYS[leave.leaveType];
  const leaveYear = getLeaveYear(leave.startDate);

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
        [`${balanceKey}.remaining`]: Number(leave.paidDays || 0),
      },
    },
    {
      runValidators: true,
    }
  );
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
       DO NOT ALLOW LEAVE ACROSS TWO YEARS
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
   CHECK COMPANY HOLIDAYS AND EXCLUDE THEM
===================================================== */

const holidays = await Holiday.find({
  holidayDate: {
    $gte: start,
    $lte: end,
  },
});

/*
  Store the holiday dates which fall inside
  the employee's requested leave range.
*/
const excludedHolidayDates = holidays.map(
  (holiday) => normalizeDate(holiday.holidayDate)
);

/*
  Calculate the normal requested duration.
  Example:
  21, 22, 23, 24 = 4 days
*/
let requestedDays =
  calculateLeaveDays(
    start,
    end
  );

if (durationType === "Half Day") {
  requestedDays = 0.5;
}

const totalDays =
  requestedDays -
  excludedHolidayDates.length;

/*
  If every requested date is a holiday,
  there is no leave to apply.
*/
if (totalDays <= 0) {
  return res.status(400).json({
    message:
      "All selected dates are company holidays. Please select working days.",
  });
}

    /* =====================================================
       FIND EMPLOYEE
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
       CHECK YEARLY LEAVE BALANCE

       Leave Without Pay does not use balance.
    ===================================================== */

    let paidDays = 0;
    let unpaidDays = 0;
    let balanceDeducted = false;

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
         RESERVE BALANCE WHEN THE LEAVE IS SUBMITTED
      =================================================== */

      const updatedYearlyBalance =
        await YearlyLeaveBalance.findOneAndUpdate(
          {
            employee: userId,
            year: leaveYear,
            [`${balanceKey}.remaining`]: {
              $gte: totalDays,
            },
          },
          {
            $inc: {
              [`${balanceKey}.remaining`]: -totalDays,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedYearlyBalance) {
        return res.status(409).json({
          message:
            `Insufficient ${leaveType} balance or the yearly balance has changed. Please refresh and try again.`,
        });
      }

      balanceDeducted = true;
    }

    /* =====================================================
       CREATE LEAVE REQUEST
    ===================================================== */

    const leave =
      await Leave.create({
        employee: user._id,

        department:
          user.department || "",

        leaveType,

        durationType,
        halfDaySession,

        startDate: start,

        endDate: end,

        excludedHolidayDates,

        reason: trimmedReason,

        totalDays,

        paidDays,

        unpaidDays,

        status:
          "Pending",

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
       CREATE ADMIN NOTIFICATIONS
    ===================================================== */

    const admins =
      await User.find({
        role: "admin",
      });

    for (
      const admin of admins
    ) {
      await Notification.create({
        recipient:
          admin._id,

        sender:
          user._id,

        title:
          "New Leave Request",

        message:
          `${user.name} applied for ${leaveType} leave.`,
      });

      try {
        if (admin.email) {
          await sendEmail(
            admin.email,
            "New Leave Request Submitted",
            `
              <h2>New Leave Request</h2>

              <p>
                <strong>${user.name}</strong>
                has applied for leave.
              </p>

              <p>
                <strong>Leave Type:</strong>
                ${leaveType}
              </p>

              <p>
                <strong>Start Date:</strong>
                ${start.toDateString()}
              </p>

              <p>
                <strong>End Date:</strong>
                ${end.toDateString()}
              </p>

              <p>
                <strong>Total Days:</strong>
                ${totalDays}
              </p>

              <p>
                <strong>Reason:</strong>
                ${trimmedReason}
              </p>
            `
          );
        }
      } catch (emailError) {
        console.error(
          "ADMIN EMAIL ERROR:",
          emailError
        );
      }
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

const getMyLeaves = async (
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
========================================================= */

const getAllLeaves = async (
  req,
  res
) => {
  try {
    const leaves =
      await Leave.find()
        .populate(
          "employee",
          "name email role department"
        )
        .sort({
          createdAt: -1,
        });

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

const cancelLeave = async (
  req,
  res
) => {
  try {
    const userId =
      getLoggedInUserId(req);

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
      leave.employee.toString() !==
      userId.toString()
    ) {
      return res.status(403).json({
        message:
          "You are not authorized to cancel this leave.",
      });
    }

    if (
      leave.status ===
      "Cancelled"
    ) {
      return res.status(400).json({
        message:
          "This leave has already been cancelled.",
      });
    }

    /* =====================================================
       RESTORE YEARLY BALANCE IF IT WAS RESERVED
    ===================================================== */

    await restoreDeductedLeaveBalance(leave);

    leave.status =
      "Cancelled";

    leave.balanceDeducted =
      false;

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

/* =========================================================
   MANAGER - GET TEAM LEAVES
========================================================= */

const getManagerLeaves = async (
  req,
  res
) => {
  try {
    const managerId =
      getLoggedInUserId(req);

    const employees =
      await User.find({
        manager:
          managerId,
      }).select(
        "_id name manager"
      );

    const employeeIds =
      employees.map(
        (emp) => emp._id
      );

    const leaves =
      await Leave.find({
        employee: {
          $in:
            employeeIds,
        },
      })
        .populate(
          "employee",
          "name email department"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json(
      leaves
    );

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
   DEPARTMENT HEAD - GET LEAVES
========================================================= */

const getDepartmentHeadLeaves = async (req, res) => {
  try {
    const departmentHead = req.user;

    const leaves = await Leave.find({
      managerStatus: "Approved",
    })
      .populate(
        "employee",
        "name email department departmentHead"
      )
      .sort({
        createdAt: -1,
      });

    const departmentHeadId =
      (
        departmentHead._id ||
        departmentHead.id
      ).toString();

    const assignedLeaves = leaves.filter((leave) => {
      if (!leave.employee?.departmentHead) {
        return false;
      }

      return (
        leave.employee.departmentHead.toString() ===
        departmentHeadId
      );
    });

    console.log("======================================");
    console.log("DEPARTMENT HEAD DEBUG");
    console.log(
      "Department Head:",
      departmentHead.name
    );
    console.log(
      "Department Head ID:",
      departmentHeadId
    );
    console.log(
      "Manager Approved Leaves:",
      leaves.length
    );
    console.log(
      "Leaves Assigned To This Department Head:",
      assignedLeaves.length
    );
    console.log("======================================");

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
   HR - GET LEAVES
========================================================= */

const getHRLeaves = async (
  req,
  res
) => {
  try {
    const leaves =
      await Leave.find({
        departmentHeadStatus:
          "Approved",
      })
        .populate(
          "employee",
          "name email department"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json(
      leaves
    );

  } catch (error) {
    console.error(
      "GET HR LEAVES ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Server Error",
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
      ![
        "Approved",
        "Rejected",
      ].includes(status)
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

    const managerId =
      getLoggedInUserId(req);

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

    if (
      leave.managerStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        message:
          "Manager has already reviewed this leave.",
      });
    }

    /* REJECT */

    if (
      status === "Rejected"
    ) {
      leave.managerStatus =
        "Rejected";

      leave.status =
        "Rejected";

      await restoreDeductedLeaveBalance(leave);

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
                Your leave request has been rejected by the Manager.
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

    /* APPROVE */

    leave.managerStatus =
      "Approved";

    leave.departmentHeadStatus =
      "Pending";

    leave.hrStatus =
      "Pending";

    leave.adminStatus =
      "Pending";

    leave.status =
      "Pending";

    await leave.save();

    return res.status(200).json({
      message:
        "Leave approved by Manager and forwarded to Department Head.",

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

const departmentHeadApproval =
  async (
    req,
    res
  ) => {
    try {
      const { status } =
        req.body;

      if (
        ![
          "Approved",
          "Rejected",
        ].includes(status)
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

      if (
        !employee.departmentHead ||
        employee.departmentHead.toString() !==
          departmentHeadId.toString()
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to review this employee's leave.",
        });
      }

      if (
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

      /* REJECT */

      if (
        status === "Rejected"
      ) {
        leave.departmentHeadStatus =
          "Rejected";

        leave.status =
          "Rejected";

        await restoreDeductedLeaveBalance(leave);

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
                  Your leave request has been rejected by the Department Head.
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

      /* APPROVE */

      leave.departmentHeadStatus =
        "Approved";

      leave.hrStatus =
        "Pending";

      leave.adminStatus =
        "Pending";

      leave.status =
        "Pending";

      await leave.save();

      return res.status(200).json({
        message:
          "Leave approved by Department Head and forwarded to HR.",

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
      ![
        "Approved",
        "Rejected",
      ].includes(status)
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
      leave.managerStatus !==
      "Approved"
    ) {
      return res.status(400).json({
        message:
          "Manager approval is required before HR approval.",
      });
    }

    if (
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

    /* REJECT */

    if (
      status === "Rejected"
    ) {
      leave.hrStatus =
        "Rejected";

      leave.status =
        "Rejected";

      await restoreDeductedLeaveBalance(leave);

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
                Your leave request has been rejected by HR.
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

    /* APPROVE */

    leave.hrStatus =
      "Approved";

    leave.adminStatus =
      "Pending";

    leave.status =
      "Pending";

    await leave.save();

    return res.status(200).json({
      message:
        "Leave approved by HR and forwarded to Admin for final approval.",

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
   ADMIN - FINAL LEAVE STATUS
========================================================= */

const updateLeaveStatus =
  async (
    req,
    res
  ) => {
    try {
      const { status } =
        req.body;

      if (
        ![
          "Approved",
          "Rejected",
        ].includes(status)
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
        leave.status !==
        "Pending"
      ) {
        return res.status(400).json({
          message:
            `This leave request has already been ${leave.status.toLowerCase()}.`,
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

      const user =
        await User.findById(
          leave.employee
        );

      if (!user) {
        return res.status(404).json({
          message:
            "Employee not found.",
        });
      }

      /* ===================================================
         CHECK APPROVAL FLOW
      =================================================== */

      if (
        status === "Approved"
      ) {
        if (
          leave.managerStatus !==
          "Approved"
        ) {
          return res.status(400).json({
            message:
              "Manager approval is required before Admin final approval.",
          });
        }

        if (
          leave.departmentHeadStatus !==
          "Approved"
        ) {
          return res.status(400).json({
            message:
              "Department Head approval is required before Admin final approval.",
          });
        }

        if (
          leave.hrStatus !==
          "Approved"
        ) {
          return res.status(400).json({
            message:
              "HR approval is required before Admin final approval.",
          });
        }
      }

      /* ===================================================
         ADMIN REJECTION
      =================================================== */

      if (
        status === "Rejected"
      ) {
        leave.adminStatus =
          "Rejected";

        leave.status =
          "Rejected";

        await restoreDeductedLeaveBalance(leave);

        leave.balanceDeducted =
          false;

        await leave.save();

        try {
          if (user.email) {
            await sendEmail(
              user.email,
              "Leave Request Rejected",
              `
                <h2>Leave Request Rejected</h2>

                <p>
                  Hello <strong>${user.name}</strong>,
                </p>

                <p>
                  Your leave request has been rejected.
                </p>
              `
            );
          }
        } catch (emailError) {
          console.error(
            "REJECTION EMAIL ERROR:",
            emailError
          );
        }

        return res.status(200).json({
          message:
            "Leave request rejected successfully.",

          leave,
        });
      }

      /* ===================================================
         LEAVE WITHOUT PAY
      =================================================== */

      if (
        leave.leaveType ===
        "Leave Without Pay"
      ) {
        leave.paidDays =
          0;

        leave.unpaidDays =
          leave.totalDays;

        leave.adminStatus =
          "Approved";

        leave.status =
          "Approved";

        leave.balanceDeducted =
          false;

        await leave.save();

        return res.status(200).json({
          message:
            "Leave request approved successfully.",

          leave,
        });
      }

      /* ===================================================
         GET YEARLY BALANCE
      =================================================== */

      const balanceKey =
        LEAVE_BALANCE_KEYS[
          leave.leaveType
        ];

      if (!balanceKey) {
        return res.status(400).json({
          message:
            "Unable to determine employee leave balance type.",
        });
      }

      const leaveYear =
        getLeaveYear(
          leave.startDate
        );

      if (!leaveYear) {
        return res.status(400).json({
          message:
            "Unable to determine leave year.",
        });
      }

      const requiredDays =
        Number(
          leave.totalDays || 0
        );

        console.log("========== BALANCE DEDUCTION DEBUG ==========");
console.log("Employee ID:", leave.employee);
console.log("Leave Type:", leave.leaveType);
console.log("Balance Key:", balanceKey);
console.log("Leave Year:", leaveYear);
console.log("Required Days:", requiredDays);
console.log("=============================================");

      /* ===================================================
         ATOMIC YEARLY BALANCE DEDUCTION
      =================================================== */
console.log("========== BEFORE YEARLY BALANCE UPDATE ==========");

console.log("Employee ID:", leave.employee);
console.log("Employee ID String:", leave.employee?.toString());
console.log("Leave Type:", leave.leaveType);
console.log("Balance Key:", balanceKey);
console.log("Leave Year:", leaveYear);
console.log("Required Days:", requiredDays);

const balanceBefore =
  await YearlyLeaveBalance.findOne({
    employee: leave.employee,
    year: leaveYear,
  });

console.log(
  "YEARLY BALANCE DOCUMENT BEFORE UPDATE:",
  balanceBefore
);

if (balanceBefore) {
  console.log(
    "BALANCE BEFORE:",
    balanceBefore[balanceKey]?.remaining
  );
}

console.log("=================================================");


/* ===================================================
   ATOMIC YEARLY BALANCE DEDUCTION
=================================================== */

const updatedYearlyBalance =
  leave.balanceDeducted
    ? await YearlyLeaveBalance.findOne({
        employee: leave.employee,
        year: leaveYear,
      })
    : await YearlyLeaveBalance.findOneAndUpdate(
        {
          employee:
            leave.employee,

          year:
            leaveYear,

          [`${balanceKey}.remaining`]: {
            $gte:
              requiredDays,
          },
        },

        {
          $inc: {
            [`${balanceKey}.remaining`]:
              -requiredDays,
          },
        },

        {
          new: true,
          runValidators: true,
        }
      );


console.log("========== AFTER YEARLY BALANCE UPDATE ==========");

console.log(
  "UPDATED YEARLY BALANCE:",
  updatedYearlyBalance
);

if (updatedYearlyBalance) {
  console.log(
    "BALANCE AFTER:",
    updatedYearlyBalance[
      balanceKey
    ]?.remaining
  );
} else {
  console.log(
    "❌ UPDATED YEARLY BALANCE IS NULL"
  );
}

console.log("=================================================");

        

      if (!updatedYearlyBalance) {
        return res.status(409).json({
          message:
            `Insufficient ${leave.leaveType} balance or the yearly balance has changed. Please refresh and try again.`,
        });
      }

      /* ===================================================
         APPROVE LEAVE
      =================================================== */

      leave.paidDays =
        requiredDays;

      leave.unpaidDays =
        0;

      leave.adminStatus =
        "Approved";

      leave.status =
        "Approved";

      leave.balanceDeducted =
        true;

      await leave.save();

      /* ===================================================
         APPROVAL EMAIL
      =================================================== */

      try {
        if (user.email) {
          await sendEmail(
            user.email,
            "Leave Request Approved",
            `
              <h2>Leave Approved</h2>

              <p>
                Hello <strong>${user.name}</strong>,
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
                <strong>Total Days:</strong>
                ${leave.totalDays}
              </p>

              <p>
                <strong>Remaining ${leave.leaveType} Balance:</strong>
                ${updatedYearlyBalance[balanceKey].remaining}
              </p>
            `
          );
        }
      } catch (emailError) {
        console.error(
          "APPROVAL EMAIL ERROR:",
          emailError
        );
      }

      const updatedLeave =
        await Leave.findById(
          leave._id
        ).populate(
          "employee",
          "name email role department"
        );

      return res.status(200).json({
        message:
          "Leave request approved successfully.",

        leave:
          updatedLeave,

        yearlyBalance:
          updatedYearlyBalance[
            balanceKey
          ],
      });

    } catch (error) {
      console.error(
        "UPDATE LEAVE STATUS ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Server error while updating leave request status.",
      });
    }
  };

/* =========================================================
   ADMIN FINAL APPROVAL
========================================================= */

const adminApproval = async (
  req,
  res
) => {
  try {
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
      leave.adminStatus !==
      "Pending"
    ) {
      return res.status(400).json({
        message:
          "Admin has already reviewed this leave.",
      });
    }

    if (
      leave.managerStatus !==
      "Approved"
    ) {
      return res.status(400).json({
        message:
          "Manager approval is required before Admin can review this leave.",
      });
    }

    if (
      leave.departmentHeadStatus !==
      "Approved"
    ) {
      return res.status(400).json({
        message:
          "Department Head approval is required before Admin can review this leave.",
      });
    }

    if (
      leave.hrStatus !==
      "Approved"
    ) {
      return res.status(400).json({
        message:
          "HR approval is required before Admin can review this leave.",
      });
    }

    return updateLeaveStatus(
      req,
      res
    );

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
   EXPORT CONTROLLERS
========================================================= */

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,

  getManagerLeaves,
  getDepartmentHeadLeaves,
  getHRLeaves,

  managerApproval,
  departmentHeadApproval,
  hrApproval,
  adminApproval,
};
