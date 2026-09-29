import { useEffect, useState } from "react";
import api from "../services/api";
import "./HRDashboard.css";

function HRDashboard() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);

      const res = await api.get("/leaves/hr", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      console.log("HR Leaves:", res.data);

      setLeaves(Array.isArray(res.data) ? res.data : []);

      try {
        const profileRes = await api.get("/users/profile", {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        });
        const profileData = profileRes.data?.user || profileRes.data;
        if (profileData) {
          setUser(profileData);
          sessionStorage.setItem("user", JSON.stringify(profileData));
        }
      } catch (err) {
        console.log("HR profile load error:", err.message);
      }
    } catch (error) {
      console.error("Error fetching HR leaves:", error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "H";
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
      return photoPath;
    }
    const baseUrl = (process.env.REACT_APP_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
    return `${baseUrl}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`;
  };

  const pendingLeaves = leaves.filter(
    (leave) => leave.hrStatus === "Pending"
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) => leave.hrStatus === "Approved"
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) => leave.hrStatus === "Rejected"
  ).length;

  const totalRequests = leaves.length;

  const requestedDays = leaves.reduce((total, leave) => {
    if (leave.totalDays) {
      return total + Number(leave.totalDays);
    }

    if (leave.numberOfDays) {
      return total + Number(leave.numberOfDays);
    }

    return total;
  }, 0);

  const leaveTypes = {};

  leaves.forEach((leave) => {
    const type = leave.leaveType || "Other";

    leaveTypes[type] = (leaveTypes[type] || 0) + 1;
  });

  const sortedLeaveTypes = Object.entries(leaveTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const getPercentage = (value) => {
    if (totalRequests === 0) return 0;

    return (value / totalRequests) * 100;
  };

  const recentLeaves = [...leaves].slice(0, 5);

  if (loading) {
    return (
      <div className="hr-dashboard">
        <div className="hr-loading">
          Loading HR Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="hr-dashboard">
      <div className="hr-container">

        {/* ================= WELCOME BANNER ================= */}

        <div className="hr-welcome-banner">
          <div>
            <h1>WELCOME BACK, HR 👋</h1>

            <p>
              Here's what's happening with leave verification today.
            </p>
          </div>

          <button
            className="hr-refresh-button"
            onClick={fetchLeaves}
          >
            ↻ Refresh
          </button>
        </div>


        {/* ================= STAT CARDS ================= */}

        <div className="hr-stats-grid">

          <div className="hr-stat-card total-card">
            <div className="hr-stat-icon">
              📋
            </div>

            <div className="hr-stat-content">
              <span>Total Requests</span>

              <h2>{totalRequests}</h2>

              <small>
                Overall leave requests
              </small>
            </div>
          </div>


          <div className="hr-stat-card pending-card">
            <div className="hr-stat-icon">
              ⏳
            </div>

            <div className="hr-stat-content">
              <span>Pending Verification</span>

              <h2>{pendingLeaves}</h2>

              <small>
                Awaiting HR decision
              </small>
            </div>
          </div>


          <div className="hr-stat-card approved-card">
            <div className="hr-stat-icon">
              ✓
            </div>

            <div className="hr-stat-content">
              <span>Approved Requests</span>

              <h2>{approvedLeaves}</h2>

              <small>
                Successfully approved
              </small>
            </div>
          </div>


          <div className="hr-stat-card rejected-card">
            <div className="hr-stat-icon">
              ✕
            </div>

            <div className="hr-stat-content">
              <span>Rejected Requests</span>

              <h2>{rejectedLeaves}</h2>

              <small>
                Not approved
              </small>
            </div>
          </div>


          <div className="hr-stat-card days-card">
            <div className="hr-stat-icon">
              🗓️
            </div>

            <div className="hr-stat-content">
              <span>Requested Days</span>

              <h2>{requestedDays}</h2>

              <small>
                Total leave days requested
              </small>
            </div>
          </div>

        </div>


        {/* ================= ANALYTICS SECTION ================= */}

        <div className="hr-analytics-grid">


          {/* LEAVE OVERVIEW */}

          <div className="hr-panel">

            <div className="hr-panel-header">
              <div>
                <h2>HR Leave Overview</h2>

                <p>
                  Current leave verification activity
                </p>
              </div>

              <span className="hr-total-badge">
                {totalRequests} Total
              </span>
            </div>


            <div className="hr-progress-item">

              <div className="hr-progress-label">
                <span>Pending</span>
                <strong>{pendingLeaves}</strong>
              </div>

              <div className="hr-progress-track">
                <div
                  className="hr-progress-fill pending-fill"
                  style={{
                    width: `${getPercentage(pendingLeaves)}%`,
                  }}
                />
              </div>

            </div>


            <div className="hr-progress-item">

              <div className="hr-progress-label">
                <span>Approved</span>
                <strong>{approvedLeaves}</strong>
              </div>

              <div className="hr-progress-track">
                <div
                  className="hr-progress-fill approved-fill"
                  style={{
                    width: `${getPercentage(approvedLeaves)}%`,
                  }}
                />
              </div>

            </div>


            <div className="hr-progress-item">

              <div className="hr-progress-label">
                <span>Rejected</span>
                <strong>{rejectedLeaves}</strong>
              </div>

              <div className="hr-progress-track">
                <div
                  className="hr-progress-fill rejected-fill"
                  style={{
                    width: `${getPercentage(rejectedLeaves)}%`,
                  }}
                />
              </div>

            </div>

          </div>


          {/* REQUEST STATUS */}

          <div className="hr-panel">

            <div className="hr-panel-header">
              <div>
                <h2>Requests by Status</h2>

                <p>
                  Current request distribution
                </p>
              </div>
            </div>


            <div className="hr-status-content">

              <div
                className="hr-donut-chart"
                style={{
                  background: `conic-gradient(
                    #43836d 0% ${getPercentage(approvedLeaves)}%,
                    #e7a72c ${getPercentage(approvedLeaves)}% ${
                      getPercentage(approvedLeaves) +
                      getPercentage(pendingLeaves)
                    }%,
                    #d45454 ${
                      getPercentage(approvedLeaves) +
                      getPercentage(pendingLeaves)
                    }% 100%
                  )`,
                }}
              >

                <div className="hr-donut-center">
                  <strong>{totalRequests}</strong>
                  <span>Total</span>
                </div>

              </div>


              <div className="hr-status-list">

                <div className="hr-status-row">
                  <div>
                    <span className="status-dot approved-dot"></span>
                    Approved
                  </div>

                  <strong>{approvedLeaves}</strong>
                </div>


                <div className="hr-status-row">
                  <div>
                    <span className="status-dot pending-dot"></span>
                    Pending
                  </div>

                  <strong>{pendingLeaves}</strong>
                </div>


                <div className="hr-status-row">
                  <div>
                    <span className="status-dot rejected-dot"></span>
                    Rejected
                  </div>

                  <strong>{rejectedLeaves}</strong>
                </div>

              </div>

            </div>

          </div>


          {/* TOP LEAVE TYPES */}

          <div className="hr-panel">

            <div className="hr-panel-header">
              <div>
                <h2>Top Leave Types</h2>

                <p>
                  Most requested leave categories
                </p>
              </div>
            </div>


            <div className="hr-leave-types">

              {sortedLeaveTypes.length === 0 ? (

                <div className="hr-empty-data">
                  No leave data available.
                </div>

              ) : (

                sortedLeaveTypes.map(([type, count]) => {

                  const percentage =
                    totalRequests === 0
                      ? 0
                      : (count / totalRequests) * 100;

                  return (

                    <div
                      className="hr-leave-type"
                      key={type}
                    >

                      <div className="hr-progress-label">
                        <span>{type}</span>

                        <strong>{count}</strong>
                      </div>


                      <div className="hr-progress-track">

                        <div
                          className="hr-progress-fill leave-type-fill"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                    </div>

                  );
                })

              )}

            </div>

          </div>

        </div>


        {/* ================= RECENT REQUESTS ================= */}

        <div className="hr-bottom-grid">

          <div className="hr-recent-panel">

          <div className="hr-panel-header">

            <div>
              <h2>Recent HR Requests</h2>

              <p>
                Latest leave requests for verification
              </p>
            </div>


            <button
              className="hr-refresh-button small-refresh"
              onClick={fetchLeaves}
            >
              ↻ Refresh
            </button>

          </div>


          <div className="hr-table-wrapper">

            {recentLeaves.length === 0 ? (

              <div className="hr-no-requests">
                No leave requests available.
              </div>

            ) : (

              <table className="hr-table">

                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Days</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Status</th>
                  </tr>
                </thead>


                <tbody>

                  {recentLeaves.map((leave) => (

                    <tr key={leave._id}>

                      <td>
                        {leave.employee?.name ||
                          leave.employeeName ||
                          "Employee"}
                      </td>


                      <td>
                        {leave.leaveType || "-"}
                      </td>


                      <td>
                        {leave.totalDays ||
                          leave.numberOfDays ||
                          0}
                      </td>


                      <td>
                        {leave.startDate
                          ? new Date(
                              leave.startDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>


                      <td>
                        {leave.endDate
                          ? new Date(
                              leave.endDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>


                      <td>

                        <span
                          className={`hr-status-badge ${
                            leave.hrStatus === "Approved"
                              ? "status-approved"
                              : leave.hrStatus === "Rejected"
                              ? "status-rejected"
                              : "status-pending"
                          }`}
                        >
                          {leave.hrStatus || "Pending"}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

          </div>

          {/* ================= MY PROFILE ================= */}
          <div className="hr-panel hr-profile-panel">
            <div className="hr-panel-header">
              <div>
                <h2>My Profile</h2>
                <p>HR Administrator account details</p>
              </div>

              <span className="hr-profile-status-badge">
                Active
              </span>
            </div>

            <div className="hr-profile-card">
              <div className="hr-profile-top">
                <div className="hr-profile-avatar">
                  {user?.profilePhoto && !photoError ? (
                    <img
                      src={getPhotoUrl(user.profilePhoto)}
                      alt={user?.name || "HR Officer"}
                      className="hr-profile-img"
                      onError={() => setPhotoError(true)}
                    />
                  ) : (
                    getInitials(user?.name || "HR Officer")
                  )}
                </div>

                <div className="hr-profile-meta">
                  <h3>{user?.name || "HR Officer"}</h3>
                  <p>{user?.email || "hr@leave.com"}</p>
                  <span className="hr-role-pill">Human Resources</span>
                </div>
              </div>

              <div className="hr-profile-stats-row">
                <div className="hr-profile-stat-box">
                  <span className="hr-stat-num">{totalRequests}</span>
                  <span className="hr-stat-lbl">HR Requests</span>
                </div>

                <div className="hr-profile-stat-box">
                  <span className="hr-stat-num">{approvedLeaves}</span>
                  <span className="hr-stat-lbl">Approved</span>
                </div>

                <div className="hr-profile-stat-box">
                  <span className="hr-stat-num">{pendingLeaves}</span>
                  <span className="hr-stat-lbl">Pending</span>
                </div>
              </div>

              <div className="hr-profile-info-list">
                <div className="hr-profile-info-item">
                  <span>Role</span>
                  <strong>HR Officer</strong>
                </div>

                <div className="hr-profile-info-item">
                  <span>Employee ID</span>
                  <strong>{user?.employeeId || "HR-001"}</strong>
                </div>

                <div className="hr-profile-info-item">
                  <span>Department</span>
                  <strong>{user?.department || "Human Resources"}</strong>
                </div>

                <div className="hr-profile-info-item">
                  <span>Gender</span>
                  <strong>{user?.gender || "Not Specified"}</strong>
                </div>
              </div>

              <button
                type="button"
                className="hr-view-profile-btn"
                onClick={() => setShowProfileModal(true)}
              >
                👁 View Full Profile
              </button>
            </div>
          </div>

        </div>

      {/* ===================================================
          PROFILE DETAILS MODAL
      =================================================== */}
      {showProfileModal && (
        <div
          className="hr-modal-overlay"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="hr-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="hr-modal-header">
              <div>
                <span className="hr-modal-tag">HR PROFILE</span>
                <h2>Account Information</h2>
                <p>Complete profile details for your account</p>
              </div>

              <button
                type="button"
                className="hr-modal-close-btn"
                onClick={() => setShowProfileModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="hr-modal-body">
              <div className="hr-modal-user-summary">
                <div className="hr-modal-avatar">
                  {user?.profilePhoto && !photoError ? (
                    <img
                      src={getPhotoUrl(user.profilePhoto)}
                      alt={user?.name || "HR Officer"}
                      className="hr-modal-img"
                      onError={() => setPhotoError(true)}
                    />
                  ) : (
                    getInitials(user?.name || "HR Officer")
                  )}
                </div>

                <div className="hr-modal-user-titles">
                  <h3>{user?.name || "HR Officer"}</h3>
                  <p>{user?.email || "hr@leave.com"}</p>
                  <span className="hr-badge-role">Human Resources</span>
                </div>
              </div>

              <div className="hr-modal-details-grid">
                <div className="hr-modal-field">
                  <label>Full Name</label>
                  <span>{user?.name || "-"}</span>
                </div>

                <div className="hr-modal-field">
                  <label>Email Address</label>
                  <span>{user?.email || "-"}</span>
                </div>

                <div className="hr-modal-field">
                  <label>Role</label>
                  <span>HR Officer</span>
                </div>

                <div className="hr-modal-field">
                  <label>Employee ID</label>
                  <span>{user?.employeeId || "HR-001"}</span>
                </div>

                <div className="hr-modal-field">
                  <label>Department</label>
                  <span>{user?.department || "Human Resources"}</span>
                </div>

                <div className="hr-modal-field">
                  <label>Gender</label>
                  <span>{user?.gender || "Not Specified"}</span>
                </div>

                <div className="hr-modal-field">
                  <label>Total Verification Requests</label>
                  <span>{totalRequests} total</span>
                </div>

                <div className="hr-modal-field">
                  <label>Account Status</label>
                  <span className="hr-modal-status-active">Active</span>
                </div>
              </div>
            </div>

            <div className="hr-modal-footer">
              <button
                type="button"
                className="hr-modal-done-btn"
                onClick={() => setShowProfileModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default HRDashboard;
