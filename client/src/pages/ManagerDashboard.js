import { useEffect, useState } from "react";
import api from "../services/api";
import "./ManagerDashboard.css";

function ManagerDashboard() {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    teamMembers: 0,
    totalRequests: 0,
    requestedDays: 0,
  });

  const [leaves, setLeaves] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      /* =========================================
         GET TEAM MEMBERS
      ========================================= */

      const teamResponse = await api.get(
        "/users/my-team",
        config
      );

      const teamData = teamResponse.data || [];

      /* =========================================
         GET MANAGER LEAVE REQUESTS
      ========================================= */

      const leaveResponse = await api.get(
        "/leaves/manager",
        config
      );

      const leaveData = leaveResponse.data || [];

      /* =========================================
         CALCULATE REQUEST STATUS
      ========================================= */

      const pending = leaveData.filter(
        (leave) => leave.managerStatus === "Pending"
      ).length;

      const approved = leaveData.filter(
        (leave) => leave.managerStatus === "Approved"
      ).length;

      const rejected = leaveData.filter(
        (leave) => leave.managerStatus === "Rejected"
      ).length;

      /* =========================================
         CALCULATE TOTAL REQUESTED DAYS
      ========================================= */

      const requestedDays = leaveData.reduce(
        (total, leave) => {
          return total + (Number(leave.totalDays) || 0);
        },
        0
      );

      /* =========================================
         SAVE DATA
      ========================================= */

      setTeam(teamData);
      setLeaves(leaveData);

      setStats({
        pending,
        approved,
        rejected,
        teamMembers: teamData.length,
        totalRequests: leaveData.length,
        requestedDays,
      });

    } catch (error) {
      console.error(
        "Manager Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     RECENT LEAVES
  ========================================= */

  const recentLeaves = leaves.slice(0, 5);

  /* =========================================
     LEAVE TYPE COUNTS
  ========================================= */

  const leaveTypeCounts = leaves.reduce(
    (result, leave) => {
      const type = leave.leaveType || "Other";

      result[type] =
        (result[type] || 0) + 1;

      return result;
    },
    {}
  );

  const topLeaveTypes = Object.entries(
    leaveTypeCounts
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  /* =========================================
     HELPER FUNCTIONS
  ========================================= */

  const getEmployeeName = (leave) => {
    if (!leave.employee) {
      return "Employee";
    }

    if (typeof leave.employee === "object") {
      return (
        leave.employee.name ||
        leave.employee.fullName ||
        "Employee"
      );
    }

    return "Employee";
  };

  const getInitial = (name) => {
    if (!name) return "E";

    return name.charAt(0).toUpperCase();
  };

  const getStatusClass = (status) => {
    if (status === "Approved") {
      return "status-approved";
    }

    if (status === "Rejected") {
      return "status-rejected";
    }

    return "status-pending";
  };

  const getMaxLeaveTypeCount = () => {
    if (topLeaveTypes.length === 0) {
      return 1;
    }

    return Math.max(
      ...topLeaveTypes.map(
        ([, count]) => count
      )
    );
  };

  if (loading) {
    return (
      <div className="manager-dashboard">
        <div className="manager-loading">
          Loading Manager Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="manager-dashboard">

      <div className="manager-main">

        {/* =====================================
            WELCOME SECTION
        ===================================== */}

        <div className="manager-header">

          <div>
           <h1>Welcome Back,Manager 👋 </h1>

            <p>
              Here's what's happening with your
              team leave requests today.
            </p>
          </div>

          <button
            className="manager-refresh-btn"
            onClick={fetchDashboard}
          >
            ↻ Refresh
          </button>

        </div>


        {/* =====================================
            STATISTICS CARDS
        ===================================== */}

        <div className="manager-stats-grid">

          <div className="manager-stat-card">

            <div className="stat-icon total-icon">
              📋
            </div>

            <div className="stat-content">
              <span>Total Requests</span>

              <h2>
                {stats.totalRequests}
              </h2>

              <small>
                Team leave applications
              </small>
            </div>

          </div>


          <div className="manager-stat-card">

            <div className="stat-icon pending-icon">
              ⏳
            </div>

            <div className="stat-content">
              <span>Pending Requests</span>

              <h2>
                {stats.pending}
              </h2>

              <small>
                Awaiting your approval
              </small>
            </div>

          </div>


          <div className="manager-stat-card">

            <div className="stat-icon approved-icon">
              ✓
            </div>

            <div className="stat-content">
              <span>Approved Requests</span>

              <h2>
                {stats.approved}
              </h2>

              <small>
                Approved by manager
              </small>
            </div>

          </div>


          <div className="manager-stat-card">

            <div className="stat-icon rejected-icon">
              ✕
            </div>

            <div className="stat-content">
              <span>Rejected Requests</span>

              <h2>
                {stats.rejected}
              </h2>

              <small>
                Not approved
              </small>
            </div>

          </div>


          <div className="manager-stat-card">

            <div className="stat-icon days-icon">
              📅
            </div>

            <div className="stat-content">
              <span>Requested Days</span>

              <h2>
                {stats.requestedDays}
              </h2>

              <small>
                Total leave days requested
              </small>
            </div>

          </div>


          <div className="manager-stat-card">

            <div className="stat-icon team-icon">
              👥
            </div>

            <div className="stat-content">
              <span>Team Members</span>

              <h2>
                {stats.teamMembers}
              </h2>

              <small>
                Employees in your team
              </small>
            </div>

          </div>

        </div>


        {/* =====================================
            MIDDLE SECTION
        ===================================== */}

        <div className="manager-overview-grid">


          {/* REQUEST OVERVIEW */}

          <div className="manager-panel request-overview-panel">

            <div className="panel-header">

              <div>
                <h2>
                  Team Leave Overview
                </h2>

                <p>
                  Current leave request activity
                </p>
              </div>

            </div>


            <div className="overview-bars">

              <div className="overview-row">

                <div className="overview-label">
                  <span>Pending</span>

                  <strong>
                    {stats.pending}
                  </strong>
                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill pending-progress"
                    style={{
                      width: `${
                        stats.totalRequests
                          ? (stats.pending /
                              stats.totalRequests) *
                            100
                          : 0
                      }%`,
                    }}
                  />

                </div>

              </div>


              <div className="overview-row">

                <div className="overview-label">
                  <span>Approved</span>

                  <strong>
                    {stats.approved}
                  </strong>
                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill approved-progress"
                    style={{
                      width: `${
                        stats.totalRequests
                          ? (stats.approved /
                              stats.totalRequests) *
                            100
                          : 0
                      }%`,
                    }}
                  />

                </div>

              </div>


              <div className="overview-row">

                <div className="overview-label">
                  <span>Rejected</span>

                  <strong>
                    {stats.rejected}
                  </strong>
                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill rejected-progress"
                    style={{
                      width: `${
                        stats.totalRequests
                          ? (stats.rejected /
                              stats.totalRequests) *
                            100
                          : 0
                      }%`,
                    }}
                  />

                </div>

              </div>

            </div>


            <div className="overview-summary">

              <div>
                <span>👥</span>

                <p>
                  Team Members
                </p>

                <strong>
                  {stats.teamMembers}
                </strong>
              </div>

              <div>
                <span>📅</span>

                <p>
                  Requested Days
                </p>

                <strong>
                  {stats.requestedDays}
                </strong>
              </div>

            </div>

          </div>


          {/* STATUS */}

          <div className="manager-panel status-panel">

            <div className="panel-header">

              <div>
                <h2>
                  Requests by Status
                </h2>

                <p>
                  Current request distribution
                </p>
              </div>

            </div>


            <div className="status-circle-container">

              <div className="status-circle">

                <div className="status-circle-center">

                  <strong>
                    {stats.totalRequests}
                  </strong>

                  <span>
                    Total
                  </span>

                </div>

              </div>

            </div>


            <div className="status-list">

              <div>
                <span className="status-dot approved-dot" />

                <p>
                  Approved
                </p>

                <strong>
                  {stats.approved}
                </strong>
              </div>

              <div>
                <span className="status-dot pending-dot" />

                <p>
                  Pending
                </p>

                <strong>
                  {stats.pending}
                </strong>
              </div>

              <div>
                <span className="status-dot rejected-dot" />

                <p>
                  Rejected
                </p>

                <strong>
                  {stats.rejected}
                </strong>
              </div>

            </div>

          </div>


          {/* TOP LEAVE TYPES */}

          <div className="manager-panel leave-types-panel">

            <div className="panel-header">

              <div>
                <h2>
                  Top Leave Types
                </h2>

                <p>
                  Most requested leave categories
                </p>
              </div>

            </div>


            {topLeaveTypes.length > 0 ? (

              <div className="leave-types-list">

                {topLeaveTypes.map(
                  ([type, count]) => (

                    <div
                      className="leave-type-row"
                      key={type}
                    >

                      <div className="leave-type-name">

                        <span>
                          {type}
                        </span>

                        <strong>
                          {count}
                        </strong>

                      </div>


                      <div className="leave-type-track">

                        <div
                          className="leave-type-fill"
                          style={{
                            width: `${
                              (count /
                                getMaxLeaveTypeCount()) *
                              100
                            }%`,
                          }}
                        />

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="empty-panel">
                No leave requests available.
              </div>

            )}

          </div>

        </div>


        {/* =====================================
            BOTTOM SECTION
        ===================================== */}

        <div className="manager-bottom-grid">


          {/* RECENT REQUESTS */}

          <div className="manager-panel recent-requests-panel">

            <div className="panel-header">

              <div>
                <h2>
                  Recent Team Requests
                </h2>

                <p>
                  Latest leave applications from your team
                </p>
              </div>

              <span className="request-count-badge">
                {stats.pending} Pending
              </span>

            </div>


            <div className="manager-table-wrapper">

              <table className="manager-table">

                <thead>

                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>

                </thead>


                <tbody>

                  {recentLeaves.length > 0 ? (

                    recentLeaves.map(
                      (leave) => {

                        const employeeName =
                          getEmployeeName(
                            leave
                          );

                        return (

                          <tr
                            key={leave._id}
                          >

                            <td>

                              <div className="employee-cell">

                                <div className="employee-avatar">
                                  {getInitial(
                                    employeeName
                                  )}
                                </div>

                                <div>
                                  <strong>
                                    {employeeName}
                                  </strong>

                                  <small>
                                    Team Employee
                                  </small>
                                </div>

                              </div>

                            </td>


                            <td>
                              {leave.leaveType}
                            </td>


                            <td>
                              {leave.totalDays || 0}
                            </td>


                            <td>

                              <span
                                className={`status-badge ${getStatusClass(
                                  leave.managerStatus
                                )}`}
                              >
                                {leave.managerStatus ||
                                  "Pending"}
                              </span>

                            </td>

                          </tr>

                        );
                      }
                    )

                  ) : (

                    <tr>

                      <td
                        colSpan="4"
                        className="empty-table"
                      >
                        No team leave requests found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          </div>


          {/* TEAM MEMBERS */}

          <div className="manager-panel team-panel">

            <div className="panel-header">

              <div>
                <h2>
                  My Team
                </h2>

                <p>
                  Employees assigned to you
                </p>
              </div>

              <span className="team-total">
                {stats.teamMembers}
              </span>

            </div>


            <div className="team-list">

              {team.length > 0 ? (

                team.slice(0, 5).map(
                  (member) => {

                    const name =
                      member.name ||
                      member.fullName ||
                      "Employee";

                    return (

                      <div
                        className="team-member"
                        key={member._id}
                      >

                        <div className="team-member-avatar">
                          {getInitial(name)}
                        </div>


                        <div className="team-member-info">

                          <strong>
                            {name}
                          </strong>

                          <span>
                            {member.email ||
                              "Team Member"}
                          </span>

                        </div>


                        <div className="team-member-status">
                          Active
                        </div>

                      </div>

                    );
                  }
                )

              ) : (

                <div className="empty-panel">
                  No team members found.
                </div>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ManagerDashboard;
