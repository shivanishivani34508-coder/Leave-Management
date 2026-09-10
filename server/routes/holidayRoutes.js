const express = require("express");

const router = express.Router();
const {
  addHoliday,
  getAllHolidays,
  updateHoliday,
  deleteHoliday,
  adjustExistingHoliday,
} = require("../controllers/holidayController");

const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

/* ==========================================
   EMPLOYEE + ADMIN
   VIEW ALL HOLIDAYS
========================================== */

router.get("/", protect, getAllHolidays);

/* ==========================================
   ADMIN ONLY
========================================== */

router.post("/", protect, authorize("admin"), addHoliday);

router.post(
  "/:id/adjust-leaves",
  protect,
  authorize("admin"),
  adjustExistingHoliday
);

router.put("/:id", protect, authorize("admin"), updateHoliday);

router.delete("/:id", protect, authorize("admin"), deleteHoliday);

module.exports = router;