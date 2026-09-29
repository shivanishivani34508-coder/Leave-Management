const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");

const assignEmployeeIds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    // Get existing employees who don't have an Employee ID
    const employees = await User.find({
      role: "employee",
      $or: [
        { employeeId: { $exists: false } },
        { employeeId: null },
      ],
    }).sort({
      createdAt: 1,
      _id: 1,
    });

    console.log(
      `Employees without Employee ID: ${employees.length}`
    );

    if (employees.length === 0) {
      console.log("All employees already have Employee IDs.");
      process.exit(0);
    }

    // Find the highest existing EMP number
    const existingEmployees = await User.find({
      role: "employee",
      employeeId: {
        $regex: /^EMP\d+$/,
      },
    }).select("employeeId");

    let maxNumber = 0;

    existingEmployees.forEach((employee) => {
      const match = employee.employeeId.match(/^EMP(\d+)$/);

      if (match) {
        const number = Number(match[1]);

        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    // Assign IDs
    for (const employee of employees) {
      maxNumber++;

      employee.employeeId = `EMP${String(maxNumber).padStart(
        3,
        "0"
      )}`;

      await employee.save();

      console.log(
        `${employee.name} → ${employee.employeeId}`
      );
    }

    console.log(
      "All existing employees have been assigned Employee IDs."
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "ERROR WHILE ASSIGNING EMPLOYEE IDS:",
      error
    );

    process.exit(1);
  }
};

assignEmployeeIds();