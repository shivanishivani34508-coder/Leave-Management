import { useEffect, useState } from "react";
import api from "../services/api";
import "./DepartmentHeadDashboard.css";

function DepartmentHeadDashboard() {
  const [leaves, setLeaves] = useState([]);

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
      const res = await api.get("/leaves/department-head", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      console.log("Department Head Leaves:", res.data);
      console.log("Number of leaves:", res.data.length);
      console.log("First leave:", res.data[0]);

      setLeaves(res.data);

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
        console.log("Dept head profile load error:", err.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "D";
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

  /* =====================================================
     STATUS CALCULATIONS
  ===================================================== */

  const pendingLeaves = leaves.filter(
    (leave) => leave.departmentHeadStatus === "Pending"
  ).length;

  const approvedLeaves = leaves.filter(
    (leave) => leave.departmentHeadStatus === "Approved"
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) => leave.departmentHeadStatus === "Rejected"
  ).length;

  /* =====================================================
     DASHBOARD DISPLAY VALUES
  ===================================================== */

  const totalRequests = leaves.length;

  const totalRequestedDays = leaves.reduce((total, leave) => {
    return total + Number(leave.days || 0);
  }, 0);

  const getPercentage = (value) => {
    if (totalRequests === 0) return 0;

    return Math.round(
      (value / totalRequests) * 100
    );
  };

  const pendingPercentage =
    getPercentage(pendingLeaves);

  const approvedPercentage =
    getPercentage(approvedLeaves);

  const rejectedPercentage =
    getPercentage(rejectedLeaves);

  /* =====================================================
     TOP LEAVE TYPES
  ===================================================== */

  const leaveTypeCounts = leaves.reduce(
    (acc, leave) => {
      const type = leave.leaveType || "Other";

      if (!acc[type]) {
        acc[type] = 0;
      }

      acc[type] += 1;

      return acc;
    },
    {}
  );

  const topLeaveTypes = Object.entries(
    leaveTypeCounts
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const maxLeaveTypeCount =
    topLeaveTypes.length > 0
      ? topLeaveTypes[0][1]
      : 1;

  /* =====================================================
     RECENT REQUESTS
  ===================================================== */

  const recentLeaves = leaves.slice(0, 5);

  return (
    <div className="department-dashboard">
      <div className="department-container">

        {/* =================================================
            WELCOME BANNER
        ================================================= */}

        <section className="department-welcome-banner">

          <div className="department-welcome-content">

            <div className="department-welcome-icon">
              🏢
            </div>

            <div>
              <h1>
                Welcome back, Department Head 👋
              </h1>

              <p>
                Here's what's happening with your
                department leave requests today.
              </p>
            </div>

          </div>

          {/* ONLY REFRESH BUTTON */}
          <button
            className="department-refresh-btn"
            onClick={fetchLeaves}
          >
            ↻ Refresh
          </button>

        </section>

        {/* =================================================
            STATISTICS CARDS
        ================================================= */}

        <section className="department-stats-grid">

          {/* TOTAL REQUESTS */}

          <div className="department-stat-card department-total-card">

            <div className="department-stat-icon total-icon">
              📋
            </div>

            <div className="department-stat-content">

              <span>
                Total Requests
              </span>

              <h2>
                {totalRequests}
              </h2>

              <p>
                Department leave applications
              </p>

            </div>

          </div>

          {/* PENDING */}

          <div className="department-stat-card department-pending-card">

            <div className="department-stat-icon pending-icon">
              ⏳
            </div>

            <div className="department-stat-content">

              <span>
                Pending Requests
              </span>

              <h2>
                {pendingLeaves}
              </h2>

              <p>
                Awaiting your decision
              </p>

            </div>

          </div>

          {/* APPROVED */}

          <div className="department-stat-card department-approved-card">

            <div className="department-stat-icon approved-icon">
              ✓
            </div>

            <div className="department-stat-content">

              <span>
                Approved Requests
              </span>

              <h2>
                {approvedLeaves}
              </h2>

              <p>
                Successfully approved
              </p>

            </div>

          </div>

          {/* REJECTED */}

          <div className="department-stat-card department-rejected-card">

            <div className="department-stat-icon rejected-icon">
              ✕
            </div>

            <div className="department-stat-content">

              <span>
                Rejected Requests
              </span>

              <h2>
                {rejectedLeaves}
              </h2>

              <p>
                Not approved
              </p>

            </div>

          </div>

          {/* REQUESTED DAYS */}

          <div className="department-stat-card department-days-card">

            <div className="department-stat-icon days-icon">
              🗓️
            </div>

            <div className="department-stat-content">

              <span>
                Requested Days
              </span>

              <h2>
                {totalRequestedDays}
              </h2>

              <p>
                Total leave days requested
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            DASHBOARD INSIGHTS
        ================================================= */}

        <section className="department-insights-grid">

          {/* =================================================
              LEAVE OVERVIEW
          ================================================= */}

          <div className="department-insight-card">

            <div className="department-section-heading">

              <div>

                <h2>
                  Department Leave Overview
                </h2>

                <p>
                  Current leave request activity
                </p>

              </div>

              <span className="department-total-badge">
                {totalRequests} Total
              </span>

            </div>

            <div className="department-progress-list">

              {/* PENDING */}

              <div className="department-progress-item">

                <div className="department-progress-top">

                  <span>
                    Pending
                  </span>

                  <strong>
                    {pendingLeaves}
                  </strong>

                </div>

                <div className="department-progress-track">

                  <div
                    className="department-progress-fill pending-fill"
                    style={{
                      width: `${pendingPercentage}%`,
                    }}
                  />

                </div>

              </div>

              {/* APPROVED */}

              <div className="department-progress-item">

                <div className="department-progress-top">

                  <span>
                    Approved
                  </span>

                  <strong>
                    {approvedLeaves}
                  </strong>

                </div>

                <div className="department-progress-track">

                  <div
                    className="department-progress-fill approved-fill"
                    style={{
                      width: `${approvedPercentage}%`,
                    }}
                  />

                </div>

              </div>

              {/* REJECTED */}

              <div className="department-progress-item">

                <div className="department-progress-top">

                  <span>
                    Rejected
                  </span>

                  <strong>
                    {rejectedLeaves}
                  </strong>

                </div>

                <div className="department-progress-track">

                  <div
                    className="department-progress-fill rejected-fill"
                    style={{
                      width: `${rejectedPercentage}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              REQUEST STATUS
          ================================================= */}

          <div className="department-insight-card department-status-card">

            <div className="department-section-heading">

              <div>

                <h2>
                  Requests by Status
                </h2>

                <p>
                  Current request distribution
                </p>

              </div>

            </div>

            <div className="department-status-content">

              <div className="department-donut-wrapper">

                <div
                  className="department-donut"
                  style={{
                    background: `conic-gradient(
                      #398467 0% ${approvedPercentage}%,
                      #e8a126 ${approvedPercentage}% ${
                        approvedPercentage +
                        pendingPercentage
                      }%,
                      #d8585f ${
                        approvedPercentage +
                        pendingPercentage
                      }% 100%
                    )`,
                  }}
                >

                  <div className="department-donut-center">

                    <strong>
                      {totalRequests}
                    </strong>

                    <span>
                      Total
                    </span>

                  </div>

                </div>

              </div>

              <div className="department-status-legend">

                <div>

                  <span className="legend-dot approved-dot"></span>

                  <span>
                    Approved
                  </span>

                  <strong>
                    {approvedLeaves}
                  </strong>

                </div>

                <div>

                  <span className="legend-dot pending-dot"></span>

                  <span>
                    Pending
                  </span>

                  <strong>
                    {pendingLeaves}
                  </strong>

                </div>

                <div>

                  <span className="legend-dot rejected-dot"></span>

                  <span>
                    Rejected
                  </span>

                  <strong>
                    {rejectedLeaves}
                  </strong>

                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              TOP LEAVE TYPES
          ================================================= */}

          <div className="department-insight-card">

            <div className="department-section-heading">

              <div>

                <h2>
                  Top Leave Types
                </h2>

                <p>
                  Most requested leave categories
                </p>

              </div>

            </div>

            <div className="department-leave-types">

              {topLeaveTypes.length > 0 ? (

                topLeaveTypes.map(
                  ([type, count]) => (

                    <div
                      className="department-leave-type-item"
                      key={type}
                    >

                      <div className="department-progress-top">

                        <span>
                          {type}
                        </span>

                        <strong>
                          {count}
                        </strong>

                      </div>

                      <div className="department-progress-track">

                        <div
                          className="department-leave-type-fill"
                          style={{
                            width: `${
                              (count /
                                maxLeaveTypeCount) *
                              100
                            }%`,
                          }}
                        />

                      </div>

                    </div>

                  )
                )

              ) : (

                <p className="department-empty-text">
                  No leave data available.
                </p>

              )}

            </div>

          </div>

        </section>

        {/* =================================================
            RECENT DEPARTMENT REQUESTS
        ================================================= */}

        <section className="department-bottom-grid">

          <div className="department-recent-card">

          <div className="department-section-heading">

            <div>

              <h2>
                Recent Department Requests
              </h2>

              <p>
                Latest leave requests from your department
              </p>

            </div>

            <button
              className="department-refresh-small"
              onClick={fetchLeaves}
            >
              ↻ Refresh
            </button>

          </div>

          <div className="department-table-wrapper">

            <table className="department-table">

              <thead>

                <tr>

                  <th>
                    Employee
                  </th>

                  <th>
                    Leave Type
                  </th>

                  <th>
                    Days
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {recentLeaves.length > 0 ? (

                  recentLeaves.map(
                    (leave, index) => (

                      <tr
                        key={
                          leave._id || index
                        }
                      >

                        <td>

                          <div className="department-employee-cell">

                            <div className="department-avatar">

                              {(
                                leave.employee?.name ||
                                leave.employeeName ||
                                "E"
                              )
                                .charAt(0)
                                .toUpperCase()}

                            </div>

                            <span>

                              {leave.employee?.name ||
                                leave.employeeName ||
                                "Employee"}

                            </span>

                          </div>

                        </td>

                        <td>
                          {leave.leaveType || "-"}
                        </td>

                        <td>
                          {leave.days || 0}
                        </td>

                        <td>

                          <span
                            className={`department-status-badge ${(
                              leave.departmentHeadStatus ||
                              "Pending"
                            ).toLowerCase()}`}
                          >
                            {leave.departmentHeadStatus ||
                              "Pending"}
                          </span>

                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>

                    <td
                      colSpan="4"
                      className="department-no-data"
                    >
                      No leave requests found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          </div>

          {/* =================================================
              MY PROFILE
          ================================================= */}

          <div className="department-profile-card">
            <div className="department-section-heading">
              <div>
                <h2>My Profile</h2>
                <p>Department Head account information</p>
              </div>

              <span className="department-profile-status-badge">
                Active
              </span>
            </div>

            <div className="department-profile-inner">
              <div className="department-profile-top">
                <div className="department-profile-avatar">
                  {user?.profilePhoto && !photoError ? (
                    <img
                      src={getPhotoUrl(user.profilePhoto)}
                      alt={user?.name || "Department Head"}
                      className="department-profile-img"
                      onError={() => setPhotoError(true)}
                    />
                  ) : (
                    getInitials(user?.name || "Department Head")
                  )}
                </div>

                <div className="department-profile-meta">
                  <h3>{user?.name || "Department Head"}</h3>
                  <p>{user?.email || "depthead@leave.com"}</p>
                  <span className="department-role-pill">Department Head</span>
                </div>
              </div>

              <div className="department-profile-stats-row">
                <div className="department-profile-stat-box">
                  <span className="department-stat-num">{totalRequests}</span>
                  <span className="department-stat-lbl">Dept Requests</span>
                </div>

                <div className="department-profile-stat-box">
                  <span className="department-stat-num">{approvedLeaves}</span>
                  <span className="department-stat-lbl">Approved</span>
                </div>

                <div className="department-profile-stat-box">
                  <span className="department-stat-num">{pendingLeaves}</span>
                  <span className="department-stat-lbl">Pending</span>
                </div>
              </div>

              <div className="department-profile-info-list">
                <div className="department-profile-info-item">
                  <span>Role</span>
                  <strong>Department Head</strong>
                </div>

                <div className="department-profile-info-item">
                  <span>Employee ID</span>
                  <strong>{user?.employeeId || "DHD-001"}</strong>
                </div>

                <div className="department-profile-info-item">
                  <span>Department</span>
                  <strong>{user?.department || "Department Head"}</strong>
                </div>

                <div className="department-profile-info-item">
                  <span>Gender</span>
                  <strong>{user?.gender || "Not Specified"}</strong>
                </div>
              </div>

              <button
                type="button"
                className="department-view-profile-btn"
                onClick={() => setShowProfileModal(true)}
              >
                👁 View Full Profile
              </button>
            </div>
          </div>

        </section>

      {/* ===================================================
          PROFILE DETAILS MODAL
      =================================================== */}
      {showProfileModal && (
        <div
          className="department-modal-overlay"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="department-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="department-modal-header">
              <div>
                <span className="department-modal-tag">DEPARTMENT HEAD PROFILE</span>
                <h2>Account Information</h2>
                <p>Complete profile details for your account</p>
              </div>

              <button
                type="button"
                className="department-modal-close-btn"
                onClick={() => setShowProfileModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="department-modal-body">
              <div className="department-modal-user-summary">
                <div className="department-modal-avatar">
                  {user?.profilePhoto && !photoError ? (
                    <img
                      src={getPhotoUrl(user.profilePhoto)}
                      alt={user?.name || "Department Head"}
                      className="department-modal-img"
                      onError={() => setPhotoError(true)}
                    />
                  ) : (
                    getInitials(user?.name || "Department Head")
                  )}
                </div>

                <div className="department-modal-user-titles">
                  <h3>{user?.name || "Department Head"}</h3>
                  <p>{user?.email || "depthead@leave.com"}</p>
                  <span className="department-badge-role">Head of Department</span>
                </div>
              </div>

              <div className="department-modal-details-grid">
                <div className="department-modal-field">
                  <label>Full Name</label>
                  <span>{user?.name || "-"}</span>
                </div>

                <div className="department-modal-field">
                  <label>Email Address</label>
                  <span>{user?.email || "-"}</span>
                </div>

                <div className="department-modal-field">
                  <label>Role</label>
                  <span>Department Head</span>
                </div>

                <div className="department-modal-field">
                  <label>Employee ID</label>
                  <span>{user?.employeeId || "DHD-001"}</span>
                </div>

                <div className="department-modal-field">
                  <label>Department</label>
                  <span>{user?.department || "Department Head"}</span>
                </div>

                <div className="department-modal-field">
                  <label>Gender</label>
                  <span>{user?.gender || "Not Specified"}</span>
                </div>

                <div className="department-modal-field">
                  <label>Department Requests</label>
                  <span>{totalRequests} total</span>
                </div>

                <div className="department-modal-field">
                  <label>Account Status</label>
                  <span className="department-modal-status-active">Active</span>
                </div>
              </div>
            </div>

            <div className="department-modal-footer">
              <button
                type="button"
                className="department-modal-done-btn"
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

export default DepartmentHeadDashboard;
