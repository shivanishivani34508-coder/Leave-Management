import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    employees: 0,
  });

  const [recentLeaves, setRecentLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [
        leaveResponse,
        employeeResponse,
        holidayResponse,
      ] = await Promise.all([
        api.get("/leaves"),
        api.get("/users"),
        api.get("/holidays"),
      ]);

      const leaves = Array.isArray(leaveResponse.data)
        ? leaveResponse.data
        : leaveResponse.data?.leaves || [];

      const employees = Array.isArray(employeeResponse.data)
        ? employeeResponse.data
        : employeeResponse.data?.users || [];

      const allHolidays = Array.isArray(holidayResponse.data)
        ? holidayResponse.data
        : holidayResponse.data?.holidays || [];

      const approvedLeaves = leaves.filter(
        (leave) => leave.status === "Approved"
      );

      const rejectedLeaves = leaves.filter(
        (leave) => leave.status === "Rejected"
      );

      const pendingLeaves = leaves.filter(
        (leave) => leave.status === "Pending"
      );

      setStats({
        totalRequests: leaves.length,
        pending: pendingLeaves.length,
        approved: approvedLeaves.length,
        rejected: rejectedLeaves.length,
        employees: employees.length,
      });

      setRecentLeaves(leaves.slice(0, 5));
      setAllLeaves(leaves);

      /*
        GET ONLY UPCOMING HOLIDAYS
      */

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const upcomingHolidays = allHolidays
        .filter((holiday) => {
          const holidayDate = new Date(
            holiday.holidayDate
          );

          holidayDate.setHours(0, 0, 0, 0);

          return holidayDate >= today;
        })
        .sort((a, b) => {
          return (
            new Date(a.holidayDate) -
            new Date(b.holidayDate)
          );
        });

      setHolidays(upcomingHolidays);

    } catch (error) {
      console.error(
        "Admin Dashboard Error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

    const leaveTypeCounts = allLeaves.reduce((counts, leave) => {
    const type = leave.leaveType || "Other";

    counts[type] = (counts[type] || 0) + 1;

    return counts;
  }, {});

  const topLeaveTypes = Object.entries(leaveTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const getEmployeeName = (leave) => {
    if (leave.employee?.name) {
      return leave.employee.name;
    }

    if (leave.employee?.username) {
      return leave.employee.username;
    }

    return "Employee";
  };

  const getInitial = (name) => {
    return name
      ? name.charAt(0).toUpperCase()
      : "E";
  };

  const getLeaveDays = (leave) => {
    if (leave.totalDays) {
      return leave.totalDays;
    }

    if (leave.days) {
      return leave.days;
    }

    if (leave.startDate && leave.endDate) {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      const difference =
        Math.ceil(
          (end - start) /
          (1000 * 60 * 60 * 24)
        ) + 1;

      return difference;
    }

    return 0;
  };

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getStatusClass = (status) => {
    if (status === "Approved") {
      return "approved";
    }

    if (status === "Rejected") {
      return "rejected";
    }

    return "pending";
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-loader"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">

      <div className="admin-dashboard-container">

        {/* ===================================================
            WELCOME SECTION
        =================================================== */}

        <div className="admin-welcome">

          <div>
            <h1>
              Welcome back, Shivani 👋
            </h1>

            <p>
              Here's what's happening in your organization today.
            </p>
          </div>

          <div className="admin-welcome-date">
            <span>📅</span>

            <div>
              <strong>
                {new Date().toLocaleDateString(
                  "en-IN",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  }
                )}
              </strong>

              <small>
                Organization overview
              </small>
            </div>
          </div>

        </div>


        {/* ===================================================
            STATISTICS
        =================================================== */}

        <div className="admin-stats-grid">

          <div className="admin-stat-card total-card">

            <div className="stat-icon total-icon">
              📋
            </div>

            <div>
              <p>Total Requests</p>

              <h2>
                {stats.totalRequests}
              </h2>

              <span>
                All leave applications
              </span>
            </div>

          </div>


          <div className="admin-stat-card pending-card">

            <div className="stat-icon pending-icon">
              ⏳
            </div>

            <div>
              <p>Pending</p>

              <h2>
                {stats.pending}
              </h2>

              <span>
                Awaiting final review
              </span>
            </div>

          </div>


          <div className="admin-stat-card approved-card">

            <div className="stat-icon approved-icon">
              ✓
            </div>

            <div>
              <p>Approved</p>

              <h2>
                {stats.approved}
              </h2>

              <span>
                Successfully approved
              </span>
            </div>

          </div>


          <div className="admin-stat-card rejected-card">

            <div className="stat-icon rejected-icon">
              ✕
            </div>

            <div>
              <p>Rejected</p>

              <h2>
                {stats.rejected}
              </h2>

              <span>
                Not approved
              </span>
            </div>

          </div>


          <div className="admin-stat-card employee-card">

            <div className="stat-icon employee-icon">
              👥
            </div>

            <div>
              <p>Employees</p>

              <h2>
                {stats.employees}
              </h2>

              <span>
                Active employees
              </span>
            </div>

          </div>

        </div>


        {/* ===================================================
            MAIN DASHBOARD
        =================================================== */}

        <div className="admin-main-grid">

          {/* REQUESTS BY STATUS */}

<div className="admin-panel status-panel">

  <div className="panel-header">
    <div>
      <h2>Requests by Status</h2>
      <p>Current request distribution</p>
    </div>
  </div>

  <div className="status-circle-container">
    <div
      className="status-circle"
      style={{
        background: `conic-gradient(
          #34806f 0deg ${
            stats.totalRequests
              ? (stats.approved / stats.totalRequests) * 360
              : 0
          }deg,

          #e8a01c ${
            stats.totalRequests
              ? (stats.approved / stats.totalRequests) * 360
              : 0
          }deg ${
            stats.totalRequests
              ? ((stats.approved + stats.pending) /
                  stats.totalRequests) *
                360
              : 0
          }deg,

          #cf5555 ${
            stats.totalRequests
              ? ((stats.approved + stats.pending) /
                  stats.totalRequests) *
                360
              : 0
          }deg 360deg
        )`,
      }}
    >
      <div className="status-circle-center">
        <strong>{stats.totalRequests}</strong>
        <span>Total</span>
      </div>
    </div>
  </div>

  <div className="status-list">

    <div>
      <span className="status-dot approved-dot"></span>
      <p>Approved</p>
      <strong>{stats.approved}</strong>
    </div>

    <div>
      <span className="status-dot pending-dot"></span>
      <p>Pending</p>
      <strong>{stats.pending}</strong>
    </div>

    <div>
      <span className="status-dot rejected-dot"></span>
      <p>Rejected</p>
      <strong>{stats.rejected}</strong>
    </div>

  </div>

</div>


{/* TOP LEAVE TYPES */}

<div className="admin-panel leave-types-panel">

  <div className="panel-header">
    <div>
      <h2>Top Leave Types</h2>
      <p>Most requested leave categories</p>
    </div>
  </div>

  {topLeaveTypes.length > 0 ? (

    <div className="leave-types-list">

      {topLeaveTypes.map(([type, count]) => (

        <div
          className="leave-type-row"
          key={type}
        >

          <div className="leave-type-name">
            <span>{type}</span>
            <strong>{count}</strong>
          </div>

          <div className="leave-type-track">

            <div
              className="leave-type-progress"
              style={{
                width: `${
                  topLeaveTypes[0][1]
                    ? (count / topLeaveTypes[0][1]) * 100
                    : 0
                }%`,
              }}
            ></div>

          </div>

        </div>

      ))}

    </div>

  ) : (

    <div className="no-data">
      No leave data available.
    </div>

  )}

</div>


          {/* ===================================================
              LEFT COLUMN
          =================================================== */}

          <div className="admin-left-column">


            {/* ===================================================
                RECENT LEAVE REQUESTS
            =================================================== */}

            <div className="admin-panel recent-leaves-panel">

              <div className="panel-header">

                <div>
                  <h2>
                    Recent Leave Requests
                  </h2>

                  <p>
                    Latest leave applications from employees
                  </p>
                </div>


                <button
                  className="view-all-btn"
                  onClick={() =>
                    navigate("/manage-leaves")
                  }
                >
                  View All →
                </button>

              </div>


              <div className="recent-leaves-table-wrapper">

                <table className="recent-leaves-table">

                  <thead>

                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Days</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>

                  </thead>


                  <tbody>

                    {recentLeaves.length === 0 ? (

                      <tr>
                        <td
                          colSpan="5"
                          className="no-data"
                        >
                          No leave requests found.
                        </td>
                      </tr>

                    ) : (

                      recentLeaves.map((leave) => {

                        const employeeName =
                          getEmployeeName(leave);

                        return (

                          <tr key={leave._id}>

                            <td>

                              <div className="employee-info">

                                <div className="employee-avatar">
                                  {getInitial(employeeName)}
                                </div>

                                <strong>
                                  {employeeName}
                                </strong>

                              </div>

                            </td>


                            <td>
                              {leave.leaveType || "-"}
                            </td>


                            <td>
                              {getLeaveDays(leave)}
                            </td>


                            <td>
                              {formatDate(
                                leave.startDate
                              )}
                            </td>


                            <td>

                              <span
                                className={`leave-status ${getStatusClass(
                                  leave.status
                                )}`}
                              >
                                {leave.status || "Pending"}
                              </span>

                            </td>

                          </tr>

                        );
                      })

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* ===================================================
                LEAVE INSIGHTS
                NEW UI SECTION
            =================================================== */}

            <div className="admin-panel leave-insights-panel">

              <div className="panel-header">

                <div>
                  <h2>
                    Leave Insights
                  </h2>

                  <p>
                    Overview of leave request status
                  </p>
                </div>

                <div className="insight-total">
                  <span>Total</span>

                  <strong>
                    {stats.totalRequests}
                  </strong>
                </div>

              </div>


              <div className="insights-container">


                {/* APPROVED */}

                <div className="insight-row">

                  <div className="insight-top">

                    <div className="insight-title">

                      <span className="insight-dot approved-dot">
                      </span>

                      <span>
                        Approved Requests
                      </span>

                    </div>

                    <strong>
                      {stats.approved}
                    </strong>

                  </div>


                  <div className="insight-progress-bar">

                    <div
                      className="insight-progress approved-progress"
                      style={{
                        width: `${
                          stats.totalRequests
                            ? (
                                stats.approved /
                                stats.totalRequests
                              ) * 100
                            : 0
                        }%`,
                      }}
                    ></div>

                  </div>

                </div>


                {/* PENDING */}

                <div className="insight-row">

                  <div className="insight-top">

                    <div className="insight-title">

                      <span className="insight-dot pending-dot">
                      </span>

                      <span>
                        Pending Requests
                      </span>

                    </div>

                    <strong>
                      {stats.pending}
                    </strong>

                  </div>


                  <div className="insight-progress-bar">

                    <div
                      className="insight-progress pending-progress"
                      style={{
                        width: `${
                          stats.totalRequests
                            ? (
                                stats.pending /
                                stats.totalRequests
                              ) * 100
                            : 0
                        }%`,
                      }}
                    ></div>

                  </div>

                </div>


                {/* REJECTED */}

                <div className="insight-row">

                  <div className="insight-top">

                    <div className="insight-title">

                      <span className="insight-dot rejected-dot">
                      </span>

                      <span>
                        Rejected Requests
                      </span>

                    </div>

                    <strong>
                      {stats.rejected}
                    </strong>

                  </div>


                  <div className="insight-progress-bar">

                    <div
                      className="insight-progress rejected-progress"
                      style={{
                        width: `${
                          stats.totalRequests
                            ? (
                                stats.rejected /
                                stats.totalRequests
                              ) * 100
                            : 0
                        }%`,
                      }}
                    ></div>

                  </div>

                </div>


              </div>


              <div className="insight-summary">

                <div>

                  <span>
                    Approval Rate
                  </span>

                  <strong>
                    {stats.totalRequests
                      ? Math.round(
                          (
                            stats.approved /
                            stats.totalRequests
                          ) * 100
                        )
                      : 0}
                    %
                  </strong>

                </div>


                <div>

                  <span>
                    Pending Review
                  </span>

                  <strong>
                    {stats.pending}
                  </strong>

                </div>


                <div>

                  <span>
                    Total Employees
                  </span>

                  <strong>
                    {stats.employees}
                  </strong>

                </div>

              </div>

            </div>


          </div>


          {/* ===================================================
              RIGHT COLUMN
          =================================================== */}

          <div className="admin-right-column">


            {/* ===================================================
                QUICK ACTIONS
            =================================================== */}

            <div className="admin-panel quick-actions-panel">

              <div className="panel-header">

                <div>
                  <h2>
                    Quick Actions
                  </h2>

                  <p>
                    Manage your organization
                  </p>
                </div>

              </div>


              <div className="quick-actions-list">


                <button
                  className="quick-action"
                  onClick={() =>
                    navigate("/add-employee")
                  }
                >

                  <span className="quick-action-icon">
                    +
                  </span>

                  <span>
                    Add Employee
                  </span>

                  <b>
                    →
                  </b>

                </button>


                <button
                  className="quick-action"
                  onClick={() =>
                    navigate("/employees")
                  }
                >

                  <span className="quick-action-icon">
                    👥
                  </span>

                  <span>
                    Manage Employees
                  </span>

                  <b>
                    →
                  </b>

                </button>


                <button
                  className="quick-action"
                  onClick={() =>
                    navigate("/manage-leaves")
                  }
                >

                  <span className="quick-action-icon">
                    📋
                  </span>

                  <span>
                    Manage Leaves
                  </span>

                  <b>
                    →
                  </b>

                </button>


                <button
                  className="quick-action"
                  onClick={() =>
                    navigate("/departments")
                  }
                >

                  <span className="quick-action-icon">
                    🏢
                  </span>

                  <span>
                    Departments
                  </span>

                  <b>
                    →
                  </b>

                </button>

              </div>

            </div>


            {/* ===================================================
                UPCOMING HOLIDAYS
            =================================================== */}

            <div className="admin-panel holidays-panel">

              <div className="panel-header">

                <div>

                  <h2>
                    Upcoming Holidays
                  </h2>

                  <p>
                    Company holidays and events
                  </p>

                </div>


                <button
                  className="holiday-calendar-btn"
                  onClick={() => navigate("/admin/holiday-calendar")
                  }
                >
                  📅 Calendar
                </button>

              </div>


              <div className="holiday-list">

                {holidays.length === 0 ? (

                  <div className="no-holidays">

                    <span>
                      📅
                    </span>

                    <p>
                      No upcoming holidays available.
                    </p>

                  </div>

                ) : (

                  holidays.slice(0, 4).map(
                    (holiday) => {

                      const holidayDate =
                        new Date(
                          holiday.holidayDate
                        );

                      const today =
                        new Date();

                      today.setHours(
                        0,
                        0,
                        0,
                        0
                      );

                      holidayDate.setHours(
                        0,
                        0,
                        0,
                        0
                      );

                      const daysRemaining =
                        Math.ceil(
                          (
                            holidayDate -
                            today
                          ) /
                          (
                            1000 *
                            60 *
                            60 *
                            24
                          )
                        );

                      return (

                        <div
                          className="holiday-item"
                          key={holiday._id}
                        >

                          <div className="holiday-date">

                            <strong>
                              {holidayDate
                                .getDate()
                                .toString()
                                .padStart(
                                  2,
                                  "0"
                                )}
                            </strong>

                            <span>
                              {holidayDate
                                .toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                  }
                                )
                                .toUpperCase()}
                            </span>

                          </div>


                          <div className="holiday-details">

                            <h4>
                              🎉{" "}
                              {holiday.holidayName}
                            </h4>

                            <p>
                              {holidayDate.toLocaleDateString(
                                "en-IN",
                                {
                                  weekday:
                                    "long",
                                  day:
                                    "2-digit",
                                  month:
                                    "long",
                                  year:
                                    "numeric",
                                }
                              )}
                            </p>

                          </div>


                          <div className="holiday-days-left">

                            {daysRemaining === 0
                              ? "Today"
                              : daysRemaining === 1
                              ? "Tomorrow"
                              : `${daysRemaining} days`}

                          </div>

                        </div>

                      );

                    }
                  )

                )}

              </div>

            </div>


          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;