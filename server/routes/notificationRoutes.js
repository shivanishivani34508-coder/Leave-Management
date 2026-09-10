const express = require("express");

const router = express.Router();

const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

/* =========================================================
   GET ALL NOTIFICATIONS
========================================================= */

router.get(
  "/",
  protect,
  getMyNotifications
);

/* =========================================================
   GET UNREAD NOTIFICATION COUNT
========================================================= */

router.get(
  "/unread-count",
  protect,
  getUnreadCount
);

/* =========================================================
   MARK NOTIFICATION AS READ
========================================================= */

router.put(
  "/:id/read",
  protect,
  markAsRead
);

/* =========================================================
   CLEAR ALL NOTIFICATIONS
========================================================= */

router.delete(
  "/clear-all",
  protect,
  clearAllNotifications
);

/* =========================================================
   DELETE SINGLE NOTIFICATION
========================================================= */

router.delete(
  "/:id",
  protect,
  deleteNotification
);

module.exports = router;