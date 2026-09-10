const Holiday = require("../models/Holiday");
const Leave = require("../models/Leave");
const YearlyLeaveBalance = require("../models/YearlyLeaveBalance");
const LeaveHolidayAdjustment = require("../models/LeaveHolidayAdjustment");


/* ==========================================
   ADJUST EXISTING LEAVES FOR SUDDEN HOLIDAY
========================================== */

const adjustLeavesForHoliday = async (holiday) => {
  try {
    const holidayDate = new Date(holiday.holidayDate);

    if (Number.isNaN(holidayDate.getTime())) {
      console.log("Invalid holiday date. Adjustment skipped.");
      return;
    }

    /*
      Normalize holiday date to UTC day.
      This keeps the comparison consistent with
      the leave dates used by the application.
    */
    const normalizedHolidayDate = new Date(
      Date.UTC(
        holidayDate.getUTCFullYear(),
        holidayDate.getUTCMonth(),
        holidayDate.getUTCDate()
      )
    );

    /*
      Find Pending and Approved leaves which contain
      the newly declared holiday date.
    */
    const leaves = await Leave.find({
      status: {
        $in: ["Pending", "Approved"],
      },
      startDate: {
        $lte: normalizedHolidayDate,
      },
      endDate: {
        $gte: normalizedHolidayDate,
      },
    });

    console.log(
      `Found ${leaves.length} leave(s) affected by holiday: ${holiday.holidayName}`
    );

    for (const leave of leaves) {
      try {
        /*
          Prevent the same holiday from adjusting
          the same leave more than once.
        */
        const alreadyAdjusted =
          await LeaveHolidayAdjustment.findOne({
            leave: leave._id,
            holiday: holiday._id,
          });

        if (alreadyAdjusted) {
          console.log(
            `Leave ${leave._id} already adjusted for holiday ${holiday._id}`
          );

          continue;
        }

        /*
          Check whether this exact date has already
          been excluded from the leave.
        */
        const alreadyExcluded = (
          leave.excludedHolidayDates || []
        ).some((date) => {
          const existingDate = new Date(date);

          return (
            existingDate.getUTCFullYear() ===
              normalizedHolidayDate.getUTCFullYear() &&
            existingDate.getUTCMonth() ===
              normalizedHolidayDate.getUTCMonth() &&
            existingDate.getUTCDate() ===
              normalizedHolidayDate.getUTCDate()
          );
        });

        if (alreadyExcluded) {
          console.log(
            `Holiday date already excluded from leave ${leave._id}`
          );

          continue;
        }

        /*
          Record the holiday adjustment.
        */
        await LeaveHolidayAdjustment.create({
          leave: leave._id,
          holiday: holiday._id,
          holidayDate: normalizedHolidayDate,
          adjustedDays: 1,
        });

        /*
          Store the exact holiday date inside the leave.
        */
        leave.excludedHolidayDates =
          leave.excludedHolidayDates || [];

        leave.excludedHolidayDates.push(
          normalizedHolidayDate
        );

        /*
          Your current system reserves/deducts the yearly
          balance when the leave is submitted.

          Therefore, when one leave day becomes a holiday,
          restore exactly one day.
        */
        if (
          leave.balanceDeducted === true &&
          leave.leaveType !== "Leave Without Pay"
        ) {
          const balanceKeys = {
            Casual: "casual",
            Sick: "sick",
            Earned: "earned",
            Marriage: "marriage",
            Maternity: "maternity",
            Paternity: "paternity",
            Bereavement: "bereavement",
          };

          const balanceKey =
            balanceKeys[leave.leaveType];

          const leaveYear =
            normalizedHolidayDate.getUTCFullYear();

          if (balanceKey) {
            await YearlyLeaveBalance.findOneAndUpdate(
              {
                employee: leave.employee,
                year: leaveYear,
              },
              {
                $inc: {
                  [`${balanceKey}.remaining`]: 1,
                },
              },
              {
                runValidators: true,
              }
            );

            console.log(
              `Restored 1 ${leave.leaveType} day to employee ${leave.employee}`
            );
          }
        }

        /*
          Remove exactly one day from the leave count.
        */
        leave.totalDays = Math.max(
          Number(leave.totalDays || 0) - 1,
          0
        );

        /*
          Reduce paidDays by one when applicable.
        */
        if (Number(leave.paidDays || 0) > 0) {
          leave.paidDays = Math.max(
            Number(leave.paidDays || 0) - 1,
            0
          );
        }

        /*
          If all days of the leave become holidays,
          cancel the leave.
        */
        if (leave.totalDays === 0) {
          leave.status = "Cancelled";
        }

        await leave.save();

        console.log(
          `Leave ${leave._id} adjusted successfully for ${holiday.holidayName}`
        );
      } catch (leaveError) {
        console.error(
          `Error adjusting leave ${leave._id}:`,
          leaveError
        );
      }
    }
  } catch (error) {
    console.error(
      "Error adjusting leaves for holiday:",
      error
    );
  }
};


/* ==========================================
   ADD HOLIDAY
========================================== */

const addHoliday = async (req, res) => {
  try {
    const {
      holidayName,
      holidayDate,
      holidayType,
      description,
    } = req.body;

    if (!holidayName || !holidayDate) {
      return res.status(400).json({
        message: "Holiday name and date are required.",
      });
    }

    const existingHoliday = await Holiday.findOne({
      holidayName,
      holidayDate,
    });

    if (existingHoliday) {
      return res.status(400).json({
        message: "Holiday already exists.",
      });
    }

    const holiday = await Holiday.create({
      holidayName,
      holidayDate,
      holidayType,
      description,
    });

    /*
      Check existing leaves after creating the holiday.
      If the newly declared holiday falls inside an
      existing Pending or Approved leave, one leave
      day is removed and the balance is restored.
    */
    await adjustLeavesForHoliday(holiday);

    res.status(201).json({
      message: "Holiday added successfully.",
      holiday,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


/* ==========================================
   GET ALL HOLIDAYS
========================================== */

const getAllHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({
      holidayDate: 1,
    });

    res.status(200).json(holidays);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


/* ==========================================
   UPDATE HOLIDAY
========================================== */

const updateHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!holiday) {
      return res.status(404).json({
        message: "Holiday not found.",
      });
    }

    res.status(200).json({
      message: "Holiday updated successfully.",
      holiday,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};


/* ==========================================
   DELETE HOLIDAY
========================================== */

const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(
      req.params.id
    );

    if (!holiday) {
      return res.status(404).json({
        message: "Holiday not found.",
      });
    }

    res.status(200).json({
      message: "Holiday deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/* ==========================================
   ADJUST LEAVES FOR EXISTING HOLIDAY
========================================== */

const adjustExistingHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({
        message: "Holiday not found.",
      });
    }

    await adjustLeavesForHoliday(holiday);

    res.status(200).json({
      message:
        "Existing holiday leave adjustment completed successfully.",
      holiday,
    });
  } catch (error) {
    console.error(
      "Error adjusting existing holiday:",
      error
    );

    res.status(500).json({
      message: "Server Error",
    });
  }
};

/* ==========================================
   EXPORT
========================================== */
module.exports = {
  addHoliday,
  getAllHolidays,
  updateHoliday,
  deleteHoliday,
  adjustLeavesForHoliday,
  adjustExistingHoliday,
};