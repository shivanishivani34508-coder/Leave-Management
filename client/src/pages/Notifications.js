import { useEffect, useState } from "react";
import api from "../services/api";
import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, []);

  /* ==========================================
     FETCH NOTIFICATIONS
  ========================================== */

  const fetchNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications");

      setNotifications(response.data);
      setMessage("");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     MARK AS READ
  ========================================== */

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);

      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error("Mark As Read Error:", error);
    }
  };

  /* ==========================================
     DELETE NOTIFICATION
  ========================================== */

  const deleteNotification = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this notification?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/notifications/${id}`);

      setNotifications((previousNotifications) =>
        previousNotifications.filter(
          (notification) => notification._id !== id
        )
      );
    } catch (error) {
      console.error("Delete Notification Error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to delete notification."
      );
    }
  };

  const handleClearAll = async () => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete all notifications?"
  );

  if (!confirmDelete) return;

  try {
    await api.delete("/notifications/clear-all", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    setNotifications([]);

    alert("All notifications cleared successfully");
  } catch (error) {
    console.error("Error clearing notifications:", error);
    alert("Failed to clear notifications");
  }
};

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h2>Loading Notifications...</h2>
      </div>
    );
  }

  /* ==========================================
     UI
  ========================================== */

  return (
   <div className="notifications-page">
      <div className="notifications-header">
        <h1>🔔 Notifications</h1>

       <button
  className="refresh-btn"
  onClick={fetchNotifications}
>
          🔄 Refresh
        </button>

        <button
  className="clear-all-btn"
  onClick={handleClearAll}
>
  🗑 Clear All
</button>

      </div>

      {message && (
        <div
          style={{
            color: "red",
            marginBottom: "20px",
          }}
        >
          {message}
        </div>
      )}

      {notifications.length === 0 ? (
        <div
          style={{
            background: "#fff",
            padding: "40px",
            textAlign: "center",
            borderRadius: "10px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
          }}
        >
          <h2>No Notifications</h2>
          <p>You don't have any notifications.</p>
        </div>
      ) : (
        notifications.map((notification) => (
         <div
  key={notification._id}
  className={`notification-card ${
    notification.isRead ? "read" : "unread"
  }`}
>
            <h3>{notification.title}</h3>

            <p>{notification.message}</p>

            <small>
              {new Date(
                notification.createdAt
              ).toLocaleString()}
            </small>

            <p
              style={{
                marginTop: "12px",
                fontWeight: "bold",
                color: notification.isRead
                  ? "green"
                  : "orangered",
              }}
            >
              {notification.isRead
                ? "✅ Read"
                : "🔴 Unread"}
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "18px",
              }}
            >
              {!notification.isRead && (
                <button
                  onClick={() =>
                    markAsRead(notification._id)
                  }
                  style={{
                    padding: "10px 18px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  ✓ Mark as Read
                </button>
              )}

              <button
                onClick={() =>
                  deleteNotification(notification._id)
                }
                style={{
                  padding: "10px 18px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Notifications;