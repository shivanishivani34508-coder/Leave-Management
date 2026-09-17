import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminReport() {
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");

  // =========================================================
  // FETCH ALL LEAVE RECORDS
  // =========================================================

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/leaves");

      setLeaves(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.log("ADMIN REPORT ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load leave report"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  // =========================================================
  // CALCULATE NUMBER OF LEAVE DAYS
  // =========================================================

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return 0;
    }

    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    const difference =
      end.getTime() - start.getTime();

    return (
      Math.floor(
        difference / millisecondsPerDay
      ) + 1
    );
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN");
  };

  // =========================================================
  // REPORT STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    return leaves.reduce(
      (result, leave) => {
        result.total += 1;

        if (leave.status === "Pending") {
          result.pending += 1;
        }

        if (leave.status === "Approved") {
          result.approved += 1;
        }

        if (leave.status === "Rejected") {
          result.rejected += 1;
        }

        if (leave.leaveType === "Casual") {
          result.casual += 1;
        }

        if (leave.leaveType === "Sick") {
          result.sick += 1;
        }

        if (leave.leaveType === "Earned") {
          result.earned += 1;
        }

        if (leave.status === "Approved") {
          result.approvedDays += calculateDays(
            leave.startDate,
            leave.endDate
          );
        }

        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        casual: 0,
        sick: 0,
        earned: 0,
        approvedDays: 0,
      }
    );
  }, [leaves]);

  // =========================================================
  // FILTER REPORT
  // =========================================================

  const filteredLeaves = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return leaves.filter((leave) => {
      const employeeName =
        leave.employee?.name
          ?.toLowerCase() || "";

      const employeeEmail =
        leave.employee?.email
          ?.toLowerCase() || "";

      const leaveType =
        leave.leaveType
          ?.toLowerCase() || "";

      const reason =
        leave.reason
          ?.toLowerCase() || "";

      const matchesSearch =
        !searchText ||
        employeeName.includes(searchText) ||
        employeeEmail.includes(searchText) ||
        leaveType.includes(searchText) ||
        reason.includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        leave.status === statusFilter;

      const matchesLeaveType =
        leaveTypeFilter === "All" ||
        leave.leaveType === leaveTypeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesLeaveType
      );
    });
  }, [
    leaves,
    search,
    statusFilter,
    leaveTypeFilter,
  ]);

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setLeaveTypeFilter("All");
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/");
  };

  // =========================================================
  // LOADING PAGE
  // =========================================================

  if (loading) {
    return (
      <div className="admin-report-page">
        <div className="admin-report-loading">
          <h2>Loading Leave Report...</h2>

          <p>
            Please wait while report information is loaded.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="admin-report-page">

      {/* HEADER */}

      <header className="admin-report-header">

        <div>
          <p className="admin-report-eyebrow">
            ADMINISTRATION / REPORTS
          </p>

          <h1>Leave Analytics Report</h1>

          <p className="admin-report-header-text">
            View leave statistics, employee requests and
            leave distribution from one dashboard.
          </p>
        </div>


        <div className="admin-report-header-buttons">

          <button
            type="button"
            className="admin-report-back-button"
            onClick={() =>
              navigate("/admin-dashboard")
            }
          >
            Back to Dashboard
          </button>


          <button
            type="button"
            className="admin-report-refresh-button"
            onClick={fetchLeaves}
          >
            Refresh Report
          </button>


          <button
            type="button"
            className="admin-report-logout-button"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>


      {/* ERROR */}

      {error && (
        <div className="admin-report-error">

          <strong>Unable to load report</strong>

          <span>{error}</span>

          <button
            type="button"
            onClick={fetchLeaves}
          >
            Try Again
          </button>

        </div>
      )}


      {/* SUMMARY CARDS */}

      <section className="admin-report-summary-grid">

        <article className="admin-report-summary-card">

          <div className="admin-report-card-icon">
            01
          </div>

          <div>
            <p>Total Requests</p>

            <h2>{statistics.total}</h2>

            <span>
              All employee leave applications
            </span>
          </div>

        </article>


        <article className="admin-report-summary-card">

          <div className="admin-report-card-icon">
            02
          </div>

          <div>
            <p>Pending Requests</p>

            <h2>{statistics.pending}</h2>

            <span>
              Waiting for administrator decision
            </span>
          </div>

        </article>


        <article className="admin-report-summary-card">

          <div className="admin-report-card-icon">
            03
          </div>

          <div>
            <p>Approved Requests</p>

            <h2>{statistics.approved}</h2>

            <span>
              Successfully approved applications
            </span>
          </div>

        </article>


        <article className="admin-report-summary-card">

          <div className="admin-report-card-icon">
            04
          </div>

          <div>
            <p>Rejected Requests</p>

            <h2>{statistics.rejected}</h2>

            <span>
              Applications rejected by administrator
            </span>
          </div>

        </article>

      </section>


      {/* LEAVE TYPE SECTION */}

      <section className="admin-report-section">

        <div className="admin-report-section-heading">

          <div>
            <p className="admin-report-eyebrow">
              LEAVE DISTRIBUTION
            </p>

            <h2>Requests by Leave Type</h2>
          </div>

          <div className="admin-report-approved-days">

            <span>Total Approved Leave Days</span>

            <strong>
              {statistics.approvedDays}
            </strong>

          </div>

        </div>


        <div className="admin-report-type-grid">

          <article className="admin-report-type-card">

            <span>CASUAL</span>

            <h3>{statistics.casual}</h3>

            <p>Casual Leave Requests</p>

          </article>


          <article className="admin-report-type-card">

            <span>SICK</span>

            <h3>{statistics.sick}</h3>

            <p>Sick Leave Requests</p>

          </article>


          <article className="admin-report-type-card">

            <span>EARNED</span>

            <h3>{statistics.earned}</h3>

            <p>Earned Leave Requests</p>

          </article>

        </div>

      </section>


      {/* REPORT TABLE */}

      <section className="admin-report-section">

        <div className="admin-report-section-heading">

          <div>
            <p className="admin-report-eyebrow">
              EMPLOYEE LEAVE RECORDS
            </p>

            <h2>Detailed Leave Report</h2>
          </div>


          <div className="admin-report-result-count">

            Showing

            <strong>
              {filteredLeaves.length}
            </strong>

            of

            <strong>
              {leaves.length}
            </strong>

            records

          </div>

        </div>


        {/* FILTERS */}

        <div className="admin-report-filters">

          <input
            type="text"
            placeholder="Search employee, email, leave type or reason"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />


          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="All">
              All Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Approved">
              Approved
            </option>

            <option value="Rejected">
              Rejected
            </option>
          </select>


          <select
            value={leaveTypeFilter}
            onChange={(e) =>
              setLeaveTypeFilter(e.target.value)
            }
          >
            <option value="All">
              All Leave Types
            </option>

            <option value="Casual">
              Casual Leave
            </option>

            <option value="Sick">
              Sick Leave
            </option>

            <option value="Earned">
              Earned Leave
            </option>
          </select>


          <button
            type="button"
            onClick={resetFilters}
            className="admin-report-reset-button"
          >
            Reset Filters
          </button>

        </div>


        {/* TABLE */}

        <div className="admin-report-table-wrapper">

          <table className="admin-report-table">

            <thead>

              <tr>

                <th>Employee</th>

                <th>Email</th>

                <th>Leave Type</th>

                <th>Start Date</th>

                <th>End Date</th>

                <th>Days</th>

                <th>Reason</th>

                <th>Status</th>

              </tr>

            </thead>


            <tbody>

              {filteredLeaves.map((leave) => (

                <tr key={leave._id}>

                  <td>

                    <div className="admin-report-employee">

                      <div className="admin-report-avatar">

                        {leave.employee?.name
                          ?.charAt(0)
                          ?.toUpperCase() || "E"}

                      </div>


                      <span>

                        {leave.employee?.name ||
                          "Unknown Employee"}

                      </span>

                    </div>

                  </td>


                  <td>

                    {leave.employee?.email || "-"}

                  </td>


                  <td>

                    <span className="admin-report-leave-type">

                      {leave.leaveType || "-"}

                    </span>

                  </td>


                  <td>

                    {formatDate(leave.startDate)}

                  </td>


                  <td>

                    {formatDate(leave.endDate)}

                  </td>


                  <td>

                    {calculateDays(
                      leave.startDate,
                      leave.endDate
                    )}

                  </td>


                  <td className="admin-report-reason">

                    {leave.reason || "-"}

                  </td>


                  <td>

                    <span
                      className={
                        `admin-report-status admin-report-status-${
                          leave.status?.toLowerCase() ||
                          "unknown"
                        }`
                      }
                    >

                      {leave.status || "Unknown"}

                    </span>

                  </td>

                </tr>

              ))}


              {filteredLeaves.length === 0 && (

                <tr>

                  <td
                    colSpan="8"
                    className="admin-report-empty"
                  >

                    No leave records match the selected filters.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}

export default AdminReport;
