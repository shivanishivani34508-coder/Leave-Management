const Holiday = require("../models/Holiday");

const currentYear = new Date().getFullYear();

/* =========================================================
   DEFAULT INDIAN HOLIDAYS
========================================================= */

const holidays = [
  {
    holidayName: "New Year's Day",
    holidayDate: new Date(`${currentYear}-01-01`),
    holidayType: "National",
    description: "First day of the year",
  },
  {
    holidayName: "Republic Day",
    holidayDate: new Date(`${currentYear}-01-26`),
    holidayType: "National",
    description: "Republic Day of India",
  },
  {
    holidayName: "Labour Day",
    holidayDate: new Date(`${currentYear}-05-01`),
    holidayType: "National",
    description: "International Workers' Day",
  },
  {
    holidayName: "Independence Day",
    holidayDate: new Date(`${currentYear}-08-15`),
    holidayType: "National",
    description: "Independence Day of India",
  },
  {
    holidayName: "Gandhi Jayanti",
    holidayDate: new Date(`${currentYear}-10-02`),
    holidayType: "National",
    description: "Birth Anniversary of Mahatma Gandhi",
  },
  {
    holidayName: "Christmas",
    holidayDate: new Date(`${currentYear}-12-25`),
    holidayType: "Festival",
    description: "Christmas Festival",
  },
];

/* =========================================================
   SEED HOLIDAYS
========================================================= */

const seedHolidays = async () => {
  try {
    console.log("🚀 Holiday Seeder Started");

    for (const holiday of holidays) {
      const exists = await Holiday.findOne({
        holidayName: holiday.holidayName,
      });

      if (!exists) {
        await Holiday.create(holiday);
        console.log(`✅ ${holiday.holidayName} inserted`);
      } else {
        console.log(`ℹ️ ${holiday.holidayName} already exists`);
      }
    }

    console.log("🎉 Holiday seeding completed");
  } catch (error) {
    console.error("❌ Holiday Seeder Error:", error);
  }
};

module.exports = seedHolidays;