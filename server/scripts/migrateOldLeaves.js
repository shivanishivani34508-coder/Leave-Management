require("dotenv").config();

const mongoose = require("mongoose");
const Leave = require("../models/Leave");

/* =========================================================
   HELPER - CALCULATE CALENDAR DAYS

   Includes both startDate and endDate.

   Example:
   July 10 -> July 11 = 2 days
========================================================= */

const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return 0;
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  return (
    Math.floor(
      (end.getTime() - start.getTime()) /
        millisecondsPerDay
    ) + 1
  );
};

/* =========================================================
   CHECK VALID NUMBER
========================================================= */

const isValidNonNegativeNumber = (value) => {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0
  );
};

/* =========================================================
   MIGRATE OLD LEAVE DOCUMENTS
========================================================= */

const migrateOldLeaves = async () => {
  try {
    /* -------------------------------------------------------
       CHECK ENVIRONMENT
    ------------------------------------------------------- */

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from the .env file."
      );
    }

    /* -------------------------------------------------------
       CONNECT
    ------------------------------------------------------- */

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully.");

    /* -------------------------------------------------------
       READ RAW DOCUMENTS

       We use Leave.collection because old MongoDB documents
       may not satisfy the current Mongoose schema.
    ------------------------------------------------------- */

    const leaves =
      await Leave.collection.find({}).toArray();

    console.log(
      `Total leave documents found: ${leaves.length}`
    );

    let updatedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;

    /* -------------------------------------------------------
       PROCESS EACH LEAVE
    ------------------------------------------------------- */

    for (const leave of leaves) {
      const calculatedTotalDays =
        calculateTotalDays(
          leave.startDate,
          leave.endDate
        );

      /* -----------------------------------------------------
         INVALID DATE DOCUMENT
      ----------------------------------------------------- */

      if (calculatedTotalDays < 1) {
        console.log(
          `SKIPPED INVALID LEAVE: ${leave._id}`
        );

        invalidCount += 1;

        continue;
      }

      const hasValidTotalDays =
        isValidNonNegativeNumber(
          leave.totalDays
        ) && leave.totalDays >= 1;

      const hasValidPaidDays =
        isValidNonNegativeNumber(
          leave.paidDays
        );

      const hasValidUnpaidDays =
        isValidNonNegativeNumber(
          leave.unpaidDays
        );

      const hasValidAllocation =
        hasValidTotalDays &&
        hasValidPaidDays &&
        hasValidUnpaidDays &&
        leave.paidDays + leave.unpaidDays ===
          leave.totalDays;

      const hasBalanceDeducted =
        typeof leave.balanceDeducted ===
        "boolean";

      /* -----------------------------------------------------
         ALREADY VALID NEW DOCUMENT

         Example:
         Marriage:
         totalDays = 32
         paidDays = 5
         unpaidDays = 27

         This document will NOT be modified.
      ----------------------------------------------------- */

      if (
        hasValidAllocation &&
        hasBalanceDeducted
      ) {
        skippedCount += 1;

        continue;
      }

      /* -----------------------------------------------------
         BUILD UPDATE
      ----------------------------------------------------- */

      const updateFields = {};

      /*
        Fix totalDays if missing, zero, invalid,
        or inconsistent with the actual date range.
      */

      if (
        !hasValidTotalDays ||
        leave.totalDays !== calculatedTotalDays
      ) {
        updateFields.totalDays =
          calculatedTotalDays;
      }

      /* -----------------------------------------------------
         ALLOCATION MIGRATION

         If the existing paid/unpaid allocation is valid,
         preserve it.

         Otherwise, historical allocation cannot safely be
         reconstructed from current balances.

         Therefore:
         paidDays = 0
         unpaidDays = totalDays
      ----------------------------------------------------- */

      if (!hasValidAllocation) {
        updateFields.paidDays = 0;
        updateFields.unpaidDays =
          calculatedTotalDays;
      }

      /* -----------------------------------------------------
         BALANCE DEDUCTED MIGRATION

         Rejected and Pending requests must not be marked as
         deducted.

         For an old Approved request, we cannot safely assume
         its balance was deducted by the new system.

         Therefore false is the conservative value.
      ----------------------------------------------------- */

      if (!hasBalanceDeducted) {
        updateFields.balanceDeducted = false;
      }

      /* -----------------------------------------------------
         NOTHING TO UPDATE
      ----------------------------------------------------- */

      if (
        Object.keys(updateFields).length === 0
      ) {
        skippedCount += 1;

        continue;
      }

      /* -----------------------------------------------------
         UPDATE DOCUMENT
      ----------------------------------------------------- */

      await Leave.collection.updateOne(
        {
          _id: leave._id,
        },
        {
          $set: updateFields,
        }
      );

      updatedCount += 1;

      console.log(
        `UPDATED: ${leave._id} | ` +
          `${leave.leaveType} | ` +
          `${leave.status} | ` +
          `${calculatedTotalDays} day(s)`
      );
    }

    /* -------------------------------------------------------
       FINAL SUMMARY
    ------------------------------------------------------- */

    console.log("");
    console.log("Migration completed.");
    console.log(
      `Documents updated: ${updatedCount}`
    );
    console.log(
      `Documents already valid: ${skippedCount}`
    );
    console.log(
      `Invalid documents skipped: ${invalidCount}`
    );

    /* -------------------------------------------------------
       VERIFY REMAINING INVALID ALLOCATIONS
    ------------------------------------------------------- */

    const migratedLeaves =
      await Leave.collection.find({}).toArray();

    const invalidAllocations =
      migratedLeaves.filter((leave) => {
        return (
          !isValidNonNegativeNumber(
            leave.totalDays
          ) ||
          leave.totalDays < 1 ||
          !isValidNonNegativeNumber(
            leave.paidDays
          ) ||
          !isValidNonNegativeNumber(
            leave.unpaidDays
          ) ||
          leave.paidDays +
            leave.unpaidDays !==
            leave.totalDays ||
          typeof leave.balanceDeducted !==
            "boolean"
        );
      });

    console.log(
      `Documents still having invalid allocation data: ${invalidAllocations.length}`
    );
  } catch (error) {
    console.error(
      "MIGRATE OLD LEAVES ERROR:",
      error
    );

    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();

      console.log("MongoDB disconnected.");
    }
  }
};

/* =========================================================
   RUN MIGRATION
========================================================= */

migrateOldLeaves();