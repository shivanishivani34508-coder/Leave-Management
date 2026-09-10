require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const DEFAULT_LEAVE_BALANCES = {
  casual: 12,
  sick: 12,
  earned: 18,
  marriage: 5,
  maternity: 182,
  paternity: 15,
  bereavement: 5,
};

const initializeLeaveBalances = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const result = await User.updateMany(
      {
        role: "employee",

        $or: [
          {
            leaveBalances: {
              $exists: false,
            },
          },
          {
            leaveBalances: null,
          },
        ],
      },
      {
        $set: {
          leaveBalances: DEFAULT_LEAVE_BALANCES,
        },
      }
    );

    console.log(
      `Employees matched: ${result.matchedCount}`
    );

    console.log(
      `Employees updated: ${result.modifiedCount}`
    );

    console.log(
      "Existing employee leave balances initialized successfully."
    );
  } catch (error) {
    console.error(
      "INITIALIZE LEAVE BALANCES ERROR:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log("MongoDB disconnected.");
  }
};

initializeLeaveBalances();