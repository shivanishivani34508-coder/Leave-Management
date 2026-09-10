const Notification = require("../models/Notification");

/* =========================================================
   GET MY NOTIFICATIONS
========================================================= */

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
    })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      message: "Failed to load notifications.",
    });
  }
};

/* =========================================================
   GET UNREAD NOTIFICATION COUNT
========================================================= */

const getUnreadCount = async (req, res) => {
  try {
    const unread = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      unread,
    });
  } catch (error) {
    console.error("GET UNREAD COUNT ERROR:", error);

    return res.status(500).json({
      message: "Failed to get unread notification count.",
    });
  }
};

/* =========================================================
   MARK NOTIFICATION AS READ
========================================================= */

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    if (
      notification.recipient.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    notification.isRead = true;

    await notification.save();

    return res.status(200).json({
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    console.error("MARK NOTIFICATION ERROR:", error);

    return res.status(500).json({
      message: "Failed to update notification.",
    });
  }
};

/* =========================================================
   DELETE NOTIFICATION
========================================================= */

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(
      req.params.id
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    if (
      notification.recipient.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await Notification.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE NOTIFICATION ERROR:", error);

    return res.status(500).json({
      message: "Failed to delete notification.",
    });
  }
};

/* =========================================================
   CLEAR ALL MY NOTIFICATIONS
========================================================= */

const clearAllNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
    });

    return res.status(200).json({
      message: "All notifications cleared successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("CLEAR ALL NOTIFICATIONS ERROR:", error);

    return res.status(500).json({
      message: "Failed to clear notifications.",
    });
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
};