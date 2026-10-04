import { useEffect, useState } from "react";

import api from "../services/api";

import "./DepartmentHeadDashboard.css";

function DepartmentHeadDashboard() {
  const [leaves, setLeaves] = useState([]);

  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchLeaves = async () => {
    try {
      setRefreshing(true);

      const res = await api.get("/leaves/department-head", {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      console.log("Department Head Leaves:", res.data);
      console.log("Number of leaves:", res.data.length);
      console.log("First leave:", res.data[0]);

      setLeaves(res.data);
    } catch (error) {
      console.error("Refresh Error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to refresh department leave requests."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // FETCH DEPARTMENT HEAD PROFILE
  // =====================================================

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await api.get("/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const profile = response.data?.user || response.data;

      console.log("Department Head Profile:", profile);

      setUser(profile);

      sessionStorage.setItem("user", JSON.stringify(profile));
    } catch (error) {
      console.error(
        "Unable to load Department Head profile:",
        error
      );
    }
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
    return total + Number(leave.totalDays || 0);
  }, 0);

  const getPercentage = (value) => {
    if (totalRequests === 0) return 0;

    return Math.round((value / totalRequests) * 100);
  };

  const pendingPercentage = getPercentage(pendingLeaves);

  const approvedPercentage = getPercentage(approvedLeaves);

  const rejectedPercentage = getPercentage(rejectedLeaves);

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

  const topLeaveTypes = Object.entries(leaveTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const maxLeaveTypeCount =
    topLeaveTypes.length > 0 ? topLeaveTypes[0][1] : 1;

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
            type="button"
            className="department-refresh-btn"
            onClick={fetchLeaves}
            disabled={refreshing}
          >
            {refreshing
              ? "↻ Refreshing..."
              : "↻ Refresh"}
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
            RECENT REQUESTS + MY PROFILE
        ================================================= */}

        <div className="department-bottom-grid">

          {/* =================================================
              RECENT DEPARTMENT REQUESTS
          ================================================= */}

          <section className="department-recent-card">

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
                type="button"
                className="department-refresh-small"
                onClick={fetchLeaves}
                disabled={refreshing}
              >
                {refreshing
                  ? "↻ Refreshing..."
                  : "↻ Refresh"}
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

          </section>


          {/* =================================================
              MY PROFILE
          ================================================= */}

          <section className="department-my-profile-card">

            <div className="department-my-profile-header">

              <div>

                <h2>
                  My Profile
                </h2>

                <p>
                  Logged-in department head details
                </p>

              </div>

              <span className="department-my-profile-status">
                Active
              </span>

            </div>


            <div className="department-my-profile-main">

              <div className="department-my-profile-avatar">

                {user?.name
                  ? user.name
                      .split(" ")
                      .map(
                        (word) =>
                          word.charAt(0)
                      )
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "DH"}

              </div>


              <div className="department-my-profile-name">

                <h3>
                  {user?.name ||
                    "Department Head"}
                </h3>

                <p>
                  {user?.email ||
                    "Email not available"}
                </p>

                <span>
                  DEPARTMENT HEAD
                </span>

              </div>

            </div>


            <div className="department-my-profile-stats">

              <div>

                <strong>
                  {totalRequests}
                </strong>

                <span>
                  Requests
                </span>

              </div>


              <div>

                <strong>
                  {approvedLeaves}
                </strong>

                <span>
                  Approved
                </span>

              </div>


              <div>

                <strong>
                  {pendingLeaves}
                </strong>

                <span>
                  Pending
                </span>

              </div>

            </div>


            <div className="department-my-profile-details">

              <div>

                <span>
                  Role
                </span>

                <strong>
                  Department Head
                </strong>

              </div>


              <div>

                <span>
                  Department
                </span>

                <strong>
                  {user?.department ||
                    "Not Assigned"}
                </strong>

              </div>


              <div>

                <span>
                  Gender
                </span>

                <strong>
                  {user?.gender ||
                    "Not Specified"}
                </strong>

              </div>

            </div>


            <button
              type="button"
              className="department-view-profile-btn"
            >
              👁 View Full Profile
            </button>

          </section>

        </div>

      </div>
    </div>
  );
}

export default DepartmentHeadDashboard;