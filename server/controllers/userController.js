const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/UserTemp");
const YearlyLeaveBalance = require("../models/YearlyLeaveBalance");
const Leave = require("../models/Leave");

/* =========================================================
   GENERATE NEXT EMPLOYEE ID
========================================================= */

const generateEmployeeId = async () => {
  const employees = await User.find({
    role: "employee",
    employeeId: { $exists: true, $ne: null },
  }).select("employeeId");

  let maxNumber = 0;

  employees.forEach((employee) => {
    const match = employee.employeeId?.match(/^EMP(\d+)$/);

    if (match) {
      const number = Number(match[1]);

      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });

  return `EMP${String(maxNumber + 1).padStart(3, "0")}`;
};

/* =========================================================
   GET ALL USERS
   ADMIN ONLY
========================================================= */

const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    const usersWithStatistics = await Promise.all(
      users.map(async (user) => {
        const statistics = await Leave.aggregate([
          {
            $match: {
              employee: new mongoose.Types.ObjectId(user._id),
            },
          },
          {
            $group: {
              _id: null,

              total: {
                $sum: 1,
              },

              approved: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$status", "Approved"],
                    },
                    1,
                    0,
                  ],
                },
              },

              pending: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$status", "Pending"],
                    },
                    1,
                    0,
                  ],
                },
              },

              rejected: {
                $sum: {
                  $cond: [
                    {
                      $eq: ["$status", "Rejected"],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]);

        const employeeStatistics =
          statistics[0] || {
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
          };

        return {
          ...user,
          statistics: {
            total: employeeStatistics.total,
            approved: employeeStatistics.approved,
            pending: employeeStatistics.pending,
            rejected: employeeStatistics.rejected,
          },
        };
      })
    );

    return res.status(200).json(usersWithStatistics);
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      message: "Unable to get users",
    });
  }
};

/* =========================================================
   GET ONE EMPLOYEE / MANAGER DETAILS
   ADMIN ONLY
========================================================= */

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    /*
      IMPORTANT:
      Allow both employee and manager here.
      This keeps the existing employee details function
      and also allows the admin to edit/view managers.
    */
if (
  user.role !== "employee" &&
  user.role !== "manager" &&
  user.role !== "departmentHead" &&
  user.role !== "hr"
) {
  return res.status(400).json({
    message:
      "The selected account cannot be edited from this page.",
  });
}

    const leaves = await Leave.find({
      employee: user._id,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    const statistics = leaves.reduce(
      (result, leave) => {
        result.total += 1;

        if (leave.status === "Pending") {
          result.pending += 1;
        }

        if (leave.status === "Approved") {
          result.approved += 1;
        }

        if (leave.status === "Rejected") {
          result.rejected += 1;
        }

        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      }
    );

    const leaveUsage = leaves.reduce(
      (result, leave) => {
        if (leave.status !== "Approved") {
          return result;
        }

        result.approvedTotalDays += Number(
          leave.totalDays || 0
        );

        result.approvedPaidDays += Number(
          leave.paidDays || 0
        );

        result.approvedUnpaidDays += Number(
          leave.unpaidDays || 0
        );

        return result;
      },
      {
        approvedTotalDays: 0,
        approvedPaidDays: 0,
        approvedUnpaidDays: 0,
      }
    );

    return res.status(200).json({
      user,
      statistics,
      leaveUsage,
      leaves,
    });
  } catch (error) {
    console.error(
      "GET USER DETAILS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to get user details.",
    });
  }
};

/* =========================================================
   GET ONE MANAGER DETAILS
   ADMIN ONLY
========================================================= */

const getManagerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid manager ID.",
      });
    }

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "Manager not found.",
      });
    }

    if (user.role !== "manager") {
      return res.status(400).json({
        message: "The selected account is not a manager.",
      });
    }

    const leaves = await Leave.find({
      employee: user._id,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    const statistics = leaves.reduce(
      (result, leave) => {
        result.total += 1;

        if (leave.status === "Pending") {
          result.pending += 1;
        }

        if (leave.status === "Approved") {
          result.approved += 1;
        }

        if (leave.status === "Rejected") {
          result.rejected += 1;
        }

        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      }
    );

    const leaveUsage = leaves.reduce(
      (result, leave) => {
        if (leave.status !== "Approved") {
          return result;
        }

        result.approvedTotalDays += Number(
          leave.totalDays || 0
        );

        result.approvedPaidDays += Number(
          leave.paidDays || 0
        );

        result.approvedUnpaidDays += Number(
          leave.unpaidDays || 0
        );

        return result;
      },
      {
        approvedTotalDays: 0,
        approvedPaidDays: 0,
        approvedUnpaidDays: 0,
      }
    );

    return res.status(200).json({
      user,
      statistics,
      leaveUsage,
      leaves,
    });
  } catch (error) {
    console.error(
      "GET MANAGER DETAILS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to get manager details.",
    });
  }
};

/* =========================================================
   CREATE EMPLOYEE
   ADMIN ONLY
========================================================= */

const createEmployee = async (req, res) => {
  try {
    console.log("UPLOADED FILE:", req.file);

    const {
      name,
      email,
      password,
      role,
      gender,
      department,
      manager,
      departmentHead,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required.",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "A user with this email already exists.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must contain at least 6 characters.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    console.log("Request Body:", req.body);

    console.log("Employee Data:", {
      name,
      email,
      password: hashedPassword,
      role,
      gender,
      department,
      manager,
      departmentHead,
    });

    const employeeId =
      role === "employee"
        ? await generateEmployeeId()
        : undefined;

    const employee = await User.create({
      name,
      employeeId,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      gender,
      department,
      manager,
      departmentHead,
      profilePhoto: req.file
        ? `/uploads/employees/${req.file.filename}`
        : "",
    });

    /* =====================================================
       CREATE CURRENT YEAR LEAVE BALANCE
    ===================================================== */

    const currentYear = new Date().getFullYear();

    await YearlyLeaveBalance.create({
      employee: employee._id,
      year: currentYear,

      casual: {
        annualAllocation: 12,
        carryForward: 0,
        totalAvailable: 12,
        remaining: 12,
      },

      sick: {
        annualAllocation: 12,
        carryForward: 0,
        totalAvailable: 12,
        remaining: 12,
      },

      earned: {
        annualAllocation: 18,
        carryForward: 0,
        totalAvailable: 18,
        remaining: 18,
      },

      marriage: {
        annualAllocation: 5,
        carryForward: 0,
        totalAvailable: 5,
        remaining: 5,
      },

      maternity: {
        annualAllocation: 182,
        carryForward: 0,
        totalAvailable: 182,
        remaining: 182,
      },

      paternity: {
        annualAllocation: 15,
        carryForward: 0,
        totalAvailable: 15,
        remaining: 15,
      },

      bereavement: {
        annualAllocation: 5,
        carryForward: 0,
        totalAvailable: 5,
        remaining: 5,
      },
    });

    console.log(
      `Yearly leave balance created for ${name} - ${currentYear}`
    );

   /* =====================================================
   CREATE NEXT YEAR BALANCE FOR NEW EMPLOYEE
===================================================== */

const nextYear = currentYear + 1;

const existingNextYearBalance =
  await YearlyLeaveBalance.findOne({
    employee: employee._id,
    year: nextYear,
  });

if (!existingNextYearBalance) {
  const currentYearBalance =
    await YearlyLeaveBalance.findOne({
      employee: employee._id,
      year: currentYear,
    });

  const casualCarryForward =
    currentYearBalance?.casual?.remaining ?? 0;

  const sickCarryForward =
    currentYearBalance?.sick?.remaining ?? 0;

  const earnedCarryForward =
    currentYearBalance?.earned?.remaining ?? 0;

  const marriageCarryForward =
    currentYearBalance?.marriage?.remaining ?? 0;

  const maternityCarryForward =
    currentYearBalance?.maternity?.remaining ?? 0;

  const paternityCarryForward =
    currentYearBalance?.paternity?.remaining ?? 0;

  const bereavementCarryForward =
    currentYearBalance?.bereavement?.remaining ?? 0;

  await YearlyLeaveBalance.create({
    employee: employee._id,
    year: nextYear,

    casual: {
      annualAllocation: 12,
      carryForward: casualCarryForward,
      totalAvailable: 12 + casualCarryForward,
      remaining: 12 + casualCarryForward,
    },

    sick: {
      annualAllocation: 12,
      carryForward: sickCarryForward,
      totalAvailable: 12 + sickCarryForward,
      remaining: 12 + sickCarryForward,
    },

    earned: {
      annualAllocation: 18,
      carryForward: earnedCarryForward,
      totalAvailable: 18 + earnedCarryForward,
      remaining: 18 + earnedCarryForward,
    },

    marriage: {
      annualAllocation: 5,
      carryForward: marriageCarryForward,
      totalAvailable: 5 + marriageCarryForward,
      remaining: 5 + marriageCarryForward,
    },

    maternity: {
      annualAllocation: 182,
      carryForward: maternityCarryForward,
      totalAvailable: 182 + maternityCarryForward,
      remaining: 182 + maternityCarryForward,
    },

    paternity: {
      annualAllocation: 15,
      carryForward: paternityCarryForward,
      totalAvailable: 15 + paternityCarryForward,
      remaining: 15 + paternityCarryForward,
    },

    bereavement: {
      annualAllocation: 5,
      carryForward: bereavementCarryForward,
      totalAvailable: 5 + bereavementCarryForward,
      remaining: 5 + bereavementCarryForward,
    },
  });

  console.log(
    `Next year yearly leave balance created for ${name} - ${nextYear}`
  );
} else {
  console.log(
    `Next year yearly leave balance already exists for ${name} - ${nextYear}`
  );
}

    const createdEmployee = await User.findById(
      employee._id
    )
      .select("-password")
      .lean();

    return res.status(201).json({
      message: "Employee created successfully.",
      user: createdEmployee,
    });
  } catch (error) {
    console.error(
      "CREATE EMPLOYEE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to create employee.",
    });
  }
};

/* =========================================================
   GET LOGGED-IN USER PROFILE
========================================================= */

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    console.log("========== GET PROFILE ==========");
    console.log("User:", user.name);
    console.log("Role:", user.role);
    console.log("Gender:", user.gender);
    console.log("Leave Balances:", user.leaveBalances);
    console.log("=================================");

    return res.status(200).json(user);
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      message: "Unable to get profile.",
    });
  }
};

/* =========================================================
   UPDATE LOGGED-IN USER PROFILE
========================================================= */

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const { name, email } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          message: "Name cannot be empty.",
        });
      }

      user.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = email
        .trim()
        .toLowerCase();

      if (!normalizedEmail) {
        return res.status(400).json({
          message: "Email cannot be empty.",
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: user._id,
        },
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            "Another user already uses this email.",
        });
      }

      user.email = normalizedEmail;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-password")
      .lean();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "UPDATE PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to update profile.",
    });
  }
};

/* =========================================================
   CHANGE PASSWORD
========================================================= */

const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message:
          "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password must contain at least 6 characters.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(
      newPassword,
      10
    );

    await user.save();

    return res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to change password.",
    });
  }
};

/* =========================================================
   UPDATE EMPLOYEE LEAVE BALANCE
   ADMIN ONLY
========================================================= */

const updateLeaveBalance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid employee ID.",
      });
    }

    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({
        message:
          "Leave balances can only be updated for employees.",
      });
    }

    const allowedBalanceFields = [
      "casual",
      "sick",
      "earned",
      "marriage",
      "maternity",
      "paternity",
      "bereavement",
    ];

    allowedBalanceFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field]);

        if (!Number.isFinite(value) || value < 0) {
          return;
        }

        employee.leaveBalances[field] = value;
      }
    });

    await employee.save();

    const updatedEmployee = await User.findById(
      employee._id
    )
      .select("-password")
      .lean();

    return res.status(200).json({
      message:
        "Employee leave balance updated successfully.",
      user: updatedEmployee,
    });
  } catch (error) {
    console.error(
      "UPDATE LEAVE BALANCE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to update employee leave balance.",
    });
  }
};

/* =========================================================
   DELETE EMPLOYEE
   ADMIN ONLY
========================================================= */

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid employee ID.",
      });
    }

    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({
        message:
          "Admin accounts cannot be deleted from Employee Management.",
      });
    }

    /* =====================================================
       DELETE ALL LEAVE APPLICATIONS
    ===================================================== */

    await Leave.deleteMany({
      employee: employee._id,
    });

    /* =====================================================
       DELETE ALL YEARLY LEAVE BALANCES
    ===================================================== */

    await YearlyLeaveBalance.deleteMany({
      employee: employee._id,
    });

    /* =====================================================
       DELETE EMPLOYEE
    ===================================================== */

    await employee.deleteOne();

    return res.status(200).json({
      message:
        "Employee, leave records and yearly leave balances deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE EMPLOYEE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to delete employee.",
    });
  }
};

/* =========================================================
   GET ALL MANAGERS
========================================================= */

const getManagers = async (req, res) => {
  try {
    const { department } = req.query;

    const filter = {
      role: "manager",
    };

    if (department) {
      filter.department = department;
    }

    const managers = await User.find(filter)
      .select("_id name email department")
      .sort({ name: 1 });

    return res.status(200).json(managers);
  } catch (error) {
    console.error("GET MANAGERS ERROR:", error);

    return res.status(500).json({
      message: "Unable to get managers.",
    });
  }
};

/* =========================================================
   GET ALL DEPARTMENT HEADS
========================================================= */

const getDepartmentHeads = async (req, res) => {
  try {
    const { department } = req.query;

    const filter = {
      role: "departmentHead",
    };

    if (department) {
      filter.department = department;
    }

    const departmentHeads = await User.find(filter)
      .select("_id name email department")
      .sort({ name: 1 });

    return res.status(200).json(departmentHeads);
  } catch (error) {
    console.error(
      "GET DEPARTMENT HEADS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to get department heads.",
    });
  }
};

/* =========================================================
   GET MY TEAM
   MANAGER ONLY
========================================================= */

const getMyTeam = async (req, res) => {
  try {
    const employees = await User.find({
      role: "employee",
      manager: req.user._id,
    }).select("-password");

    return res.status(200).json(employees);
  } catch (error) {
    console.error("GET MY TEAM ERROR:", error);

    return res.status(500).json({
      message: "Unable to get team members.",
    });
  }
};

/* =========================================================
   UPDATE EMPLOYEE / MANAGER
   ADMIN ONLY
========================================================= */

const updateEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      gender,
      department,
      manager,
      departmentHead,
      role,
    } = req.body;

    console.log("========== PHOTO DEBUG ==========");
    console.log("REQ BODY:", req.body);
    console.log("REQ FILE:", req.file);
    console.log("================================");

    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found.",
      });
    }

    employee.name = name || employee.name;

    employee.email = email || employee.email;

    employee.gender =
      gender || employee.gender;

    employee.department =
      department || employee.department;

    employee.manager =
      manager || employee.manager;

    employee.departmentHead =
      departmentHead || employee.departmentHead;

    employee.role =
      role || employee.role;

    /* UPDATE PROFILE PHOTO ONLY IF A NEW PHOTO IS UPLOADED */

    if (req.file) {
      employee.profilePhoto =
        `/uploads/employees/${req.file.filename}`;
    }

    await employee.save();

    return res.status(200).json({
      message: "Employee updated successfully.",
      user: employee,
    });
  } catch (error) {
    console.error(
      "UPDATE EMPLOYEE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Unable to update employee.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getUsers,
  getUserById,
  createEmployee,
  getProfile,
  updateProfile,
  changePassword,
  updateLeaveBalance,
  deleteUser,

  getManagers,
  getDepartmentHeads,
  getMyTeam,

  updateEmployee,
  getManagerById,
};