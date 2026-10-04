require("dotenv").config();

const mongoose = require("mongoose");
const YearlyLeaveBalance = require("./models/YearlyLeaveBalance");

const fixCarryForward = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    const currentYear = 2026;
    const nextYear = 2027;

    const nextYearBalances =
      await YearlyLeaveBalance.find({
        year: nextYear,
      });

    console.log(
      `Found ${nextYearBalances.length} existing 2027 balance records.`
    );

    let updated = 0;

    for (const nextBalance of nextYearBalances) {
      const currentBalance =
        await YearlyLeaveBalance.findOne({
          employee: nextBalance.employee,
          year: currentYear,
        });

      if (!currentBalance) {
        console.log(
          `No 2026 balance found for employee ${nextBalance.employee}`
        );

        continue;
      }

      const leaveTypes = [
        "casual",
        "sick",
        "earned",
        "marriage",
        "maternity",
        "paternity",
        "bereavement",
      ];

      for (const type of leaveTypes) {
        const previousRemaining = Number(
          currentBalance[type]?.remaining || 0
        );

        const annualAllocation = Number(
          nextBalance[type]?.annualAllocation || 0
        );

        const oldTotalAvailable = Number(
          nextBalance[type]?.totalAvailable || 0
        );

        const oldRemaining = Number(
          nextBalance[type]?.remaining || 0
        );

        const alreadyUsed =
          oldTotalAvailable - oldRemaining;

        const newTotalAvailable =
          annualAllocation + previousRemaining;

        const newRemaining =
          Math.max(
            0,
            newTotalAvailable - alreadyUsed
          );

        if (nextBalance[type]) {
          nextBalance[type].carryForward =
            previousRemaining;

          nextBalance[type].totalAvailable =
            newTotalAvailable;

          nextBalance[type].remaining =
            newRemaining;
        }
      }

      await nextBalance.save();

      updated++;

      console.log(
        `Updated employee: ${nextBalance.employee}`
      );
    }

    console.log("--------------------------------");
    console.log(
      `Successfully updated: ${updated} employees`
    );
    console.log(
      "2027 carry-forward correction completed."
    );
    console.log("--------------------------------");

    await mongoose.connection.close();
  } catch (error) {
    console.error(
      "CARRY FORWARD ERROR:",
      error
    );

    try {
      await mongoose.connection.close();
    } catch {}

    process.exit(1);
  }
};

fixCarryForward();