const mongoose = require("mongoose");
require("dotenv").config();

const LeaveYear = require("../models/LeaveYear");

const markYear = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existing = await LeaveYear.findOne({
      year: 2026,
    });

    if (existing) {
      console.log(
        "2026 is already marked as processed."
      );
    } else {
      await LeaveYear.create({
        year: 2026,
        nextYear: 2027,
        processedAt: new Date(),
        status: "Processed",
      });

      console.log(
        "2026 marked as processed successfully."
      );
    }

    await mongoose.disconnect();

    console.log("MongoDB disconnected");
  } catch (error) {
    console.error("ERROR:", error);
    process.exit(1);
  }
};

markYear();