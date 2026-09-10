require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

/* =========================================================
   REMOVE OLD LEAVE BALANCE FIELD

   Old field:
   leaveBalance

   New field:
   leaveBalances

   This script removes ONLY the old leaveBalance field.
   It does not delete users, leave requests, or leaveBalances.
========================================================= */

const removeOldLeaveBalance = async () => {
  try {
    /* =====================================================
       CHECK MONGO_URI
    ===================================================== */

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from the .env file."
      );
    }

    /* =====================================================
       CONNECT TO MONGODB
    ===================================================== */

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    /* =====================================================
       COUNT USERS WITH OLD FIELD
    ===================================================== */

    const usersWithOldField =
      await User.collection.countDocuments({
        leaveBalance: {
          $exists: true,
        },
      });

    console.log(
      `Users containing old leaveBalance field: ${usersWithOldField}`
    );

    /* =====================================================
       REMOVE OLD FIELD

       IMPORTANT:

       We use User.collection.updateMany() instead of
       User.updateMany() because leaveBalance is no longer
       part of the current Mongoose User schema.

       $unset removes only the old field.
    ===================================================== */

    const result = await User.collection.updateMany(
      {
        leaveBalance: {
          $exists: true,
        },
      },
      {
        $unset: {
          leaveBalance: "",
        },
      }
    );

    /* =====================================================
       DISPLAY RESULT
    ===================================================== */

    console.log(
      `Users matched: ${result.matchedCount}`
    );

    console.log(
      `Users updated: ${result.modifiedCount}`
    );

    /* =====================================================
       VERIFY CLEANUP
    ===================================================== */

    const remainingUsersWithOldField =
      await User.collection.countDocuments({
        leaveBalance: {
          $exists: true,
        },
      });

    console.log(
      `Users still containing old leaveBalance field: ${remainingUsersWithOldField}`
    );

    if (remainingUsersWithOldField === 0) {
      console.log(
        "Old leaveBalance field removed successfully."
      );
    } else {
      console.log(
        "Warning: Some users still contain the old leaveBalance field."
      );
    }

    /* =====================================================
       VERIFY NEW FIELD EXISTS

       This does not modify leaveBalances.
       It only counts employee documents that have it.
    ===================================================== */

    const employeesWithNewBalances =
      await User.collection.countDocuments({
        role: "employee",

        leaveBalances: {
          $exists: true,
        },
      });

    console.log(
      `Employees containing new leaveBalances field: ${employeesWithNewBalances}`
    );
  } catch (error) {
    console.error(
      "REMOVE OLD LEAVE BALANCE ERROR:",
      error
    );

    process.exitCode = 1;
  } finally {
    /* =====================================================
       DISCONNECT FROM MONGODB
    ===================================================== */

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();

      console.log("MongoDB disconnected.");
    }
  }
};

/* =========================================================
   RUN SCRIPT
========================================================= */

removeOldLeaveBalance();