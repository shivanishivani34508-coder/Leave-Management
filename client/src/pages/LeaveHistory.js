import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./LeaveHistory.css";

function LeaveHistory() {
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [cancellingId, setCancellingId] = useState(null);

  /* =========================================================
     AUTH CONFIG
  ========================================================= */

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  /* =========================================================
     HANDLE UNAUTHORIZED
  ========================================================= */

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", {
      replace: true,
    });
  }, [navigate]);

  /* =========================================================
     FETCH EMPLOYEE LEAVE HISTORY
  ========================================================= */

  const fetchLeaveHistory = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await api.get(
        "/leaves/my",
        getAuthConfig()
      );

      const leaveData = Array.isArray(response.data)
        ? response.data
        : response.data?.leaves || [];

      setLeaves(leaveData);
    } catch (error) {
      console.error(
        "FETCH LEAVE HISTORY ERROR:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load your leave history."
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    fetchLeaveHistory();
  }, [fetchLeaveHistory]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    return leaves.reduce(
      (result, leave) => {
        const status =
          leave.status?.toLowerCase() || "";

        result.total += 1;

        if (status === "pending") {
          result.pending += 1;
        }

        if (status === "approved") {
          result.approved += 1;
        }

        if (status === "rejected") {
          result.rejected += 1;
        }

        result.totalDays +=
          Number(leave.totalDays) || 0;

        result.paidDays +=
          Number(leave.paidDays) || 0;

        result.unpaidDays +=
          Number(leave.unpaidDays) || 0;

        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalDays: 0,
        paidDays: 0,
        unpaidDays: 0,
      }
    );
  }, [leaves]);

  /* =========================================================
     FILTERED LEAVES
  ========================================================= */

  const filteredLeaves = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return [...leaves]
      .filter((leave) => {
        const leaveType =
          leave.leaveType?.toLowerCase() || "";

        const reason =
          leave.reason?.toLowerCase() || "";

        const status =
          leave.status?.toLowerCase() || "";

        const matchesSearch =
          !normalizedSearch ||
          leaveType.includes(normalizedSearch) ||
          reason.includes(normalizedSearch) ||
          status.includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "All" ||
          status === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
      })
      .sort((firstLeave, secondLeave) => {
        return (
          new Date(
            secondLeave.createdAt ||
              secondLeave.startDate
          ) -
          new Date(
            firstLeave.createdAt ||
              firstLeave.startDate
          )
        );
      });
  }, [leaves, searchTerm, statusFilter]);

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  /* =========================================================
     STATUS CLASS
  ========================================================= */

  const getStatusClass = (status) => {
    const normalizedStatus =
      status?.toLowerCase();

    if (normalizedStatus === "approved") {
      return "approved";
    }

    if (normalizedStatus === "rejected") {
      return "rejected";
    }

    return "pending";
  };

  /* =========================================================
     CANCEL PENDING LEAVE
  ========================================================= */

  const handleCancelLeave = async (leave) => {
    if (leave.status !== "Pending") {
      setErrorMessage(
        "Only Pending leave requests can be cancelled."
      );

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel your ${leave.leaveType} leave request?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCancellingId(leave._id);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(
        `/leaves/${leave._id}`,
        getAuthConfig()
      );

      setLeaves((currentLeaves) =>
        currentLeaves.filter(
          (currentLeave) =>
            currentLeave._id !== leave._id
        )
      );

      setSuccessMessage(
        "Leave request cancelled successfully."
      );
    } catch (error) {
      console.error(
        "CANCEL LEAVE ERROR:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to cancel leave request."
      );
    } finally {
      setCancellingId(null);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="leave-history-page">
        <div className="leave-history-loading">
          <div className="leave-history-spinner" />

          <span className="leave-history-loading-text">
            Loading your leave history...
          </span>
        </div>
      </div>
    );
  }

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="leave-history-page">
      <div className="leave-history-container">

        {/* HEADER */}

        <header className="leave-history-header">
          <div className="leave-history-header-content">
            <span className="leave-history-label">
              📋 Employee Workspace
            </span>

            <h1 className="leave-history-title">
              Leave History
            </h1>

            <p className="leave-history-description">
              Track your leave requests, paid and unpaid
              allocation, approval status, and pending
              applications.
            </p>
          </div>

          <div className="leave-history-header-actions">
            <button
              type="button"
              className="leave-history-back-btn"
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>

            <button
              type="button"
              className="leave-history-apply-btn"
              onClick={() => navigate("/apply-leave")}
            >
              + Apply for Leave
            </button>
          </div>
        </header>

        {/* MESSAGES */}

        {errorMessage && (
          <div className="leave-history-error">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="leave-history-success">
            {successMessage}
          </div>
        )}

        {/* REQUEST STATISTICS */}

        <section className="leave-history-stats-grid">

          <article className="leave-history-stat-card">
            <div className="leave-history-stat-icon total">
              📄
            </div>

            <div className="leave-history-stat-content">
              <span className="leave-history-stat-label">
                Total Requests
              </span>

              <h2 className="leave-history-stat-value">
                {statistics.total}
              </h2>
            </div>
          </article>

          <article className="leave-history-stat-card">
            <div className="leave-history-stat-icon pending">
              ⏳
            </div>

            <div className="leave-history-stat-content">
              <span className="leave-history-stat-label">
                Pending
              </span>

              <h2 className="leave-history-stat-value">
                {statistics.pending}
              </h2>
            </div>
          </article>

          <article className="leave-history-stat-card">
            <div className="leave-history-stat-icon approved">
              ✓
            </div>

            <div className="leave-history-stat-content">
              <span className="leave-history-stat-label">
                Approved
              </span>

              <h2 className="leave-history-stat-value">
                {statistics.approved}
              </h2>
            </div>
          </article>

          <article className="leave-history-stat-card">
            <div className="leave-history-stat-icon rejected">
              ✕
            </div>

            <div className="leave-history-stat-content">
              <span className="leave-history-stat-label">
                Rejected
              </span>

              <h2 className="leave-history-stat-value">
                {statistics.rejected}
              </h2>
            </div>
          </article>

        </section>

        {/* DAY SUMMARY */}

        <section className="leave-history-days-grid">

          <article className="leave-history-day-card">
            <span className="leave-history-day-label">
              Requested Days
            </span>

            <strong className="leave-history-day-value">
              {statistics.totalDays}
            </strong>
          </article>

          <article className="leave-history-day-card paid">
            <span className="leave-history-day-label">
              Paid Days
            </span>

            <strong className="leave-history-day-value">
              {statistics.paidDays}
            </strong>
          </article>

          <article className="leave-history-day-card unpaid">
            <span className="leave-history-day-label">
              Unpaid Days
            </span>

            <strong className="leave-history-day-value">
              {statistics.unpaidDays}
            </strong>
          </article>

        </section>

        {/* HISTORY PANEL */}

        <section className="leave-history-panel">

          <div className="leave-history-panel-header">

            <div className="leave-history-panel-title-wrapper">
              <h2 className="leave-history-panel-title">
                My Leave Requests
              </h2>

              <p className="leave-history-panel-subtitle">
                Review individual requests and cancel Pending
                applications when necessary.
              </p>
            </div>

            <div className="leave-history-filter-section">

              <div className="leave-history-search-wrapper">
                <span className="leave-history-search-icon">
                  🔍
                </span>

                <input
                  type="text"
                  className="leave-history-search-input"
                  placeholder="Search leave requests..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                />
              </div>

              <select
                className="leave-history-filter-select"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
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

            </div>
          </div>

          {filteredLeaves.length === 0 ? (

            <div className="leave-history-empty">
              <div className="leave-history-empty-icon">
                📋
              </div>

              <h3 className="leave-history-empty-title">
                {leaves.length === 0
                  ? "No leave requests yet"
                  : "No matching leave requests"}
              </h3>

              <p className="leave-history-empty-description">
                {leaves.length === 0
                  ? "You have not submitted any leave requests yet."
                  : "Try changing your search or status filter."}
              </p>

              {leaves.length === 0 && (
                <button
                  type="button"
                  className="leave-history-empty-btn"
                  onClick={() =>
                    navigate("/apply-leave")
                  }
                >
                  Apply for Leave
                </button>
              )}
            </div>

          ) : (

            <>
              <div className="leave-history-table-wrapper">

                <table className="leave-history-table">

                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Dates</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Unpaid</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {filteredLeaves.map((leave) => (
                      <tr key={leave._id}>

                        <td>
                          <span className="leave-history-type">
                            {leave.leaveType || "-"}
                          </span>
                        </td>

                        <td>
                          <div className="leave-history-date-range">
                            <span>
                              {formatDate(leave.startDate)}
                            </span>

                            <span className="leave-history-date-separator">
                              →
                            </span>

                            <span>
                              {formatDate(leave.endDate)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="leave-history-total-days">
                            {Number(leave.totalDays) || 0}
                          </span>
                        </td>

                        <td>
                          <span className="leave-history-paid-days">
                            {Number(leave.paidDays) || 0}
                          </span>
                        </td>

                        <td>
                          <span className="leave-history-unpaid-days">
                            {Number(leave.unpaidDays) || 0}
                          </span>
                        </td>

                        <td>
                          <span
                            className="leave-history-reason"
                            title={leave.reason || ""}
                          >
                            {leave.reason || "-"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`leave-history-status ${getStatusClass(
                              leave.status
                            )}`}
                          >
                            {leave.status || "Pending"}
                          </span>
                        </td>

                        <td>
                          {leave.status === "Pending" ? (
                            <button
                              type="button"
                              className="leave-history-cancel-btn"
                              disabled={
                                cancellingId === leave._id
                              }
                              onClick={() =>
                                handleCancelLeave(leave)
                              }
                            >
                              {cancellingId === leave._id
                                ? "Cancelling..."
                                : "Cancel"}
                            </button>
                          ) : (
                            <span className="leave-history-no-action">
                              Reviewed
                            </span>
                          )}
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>
              </div>

              <div className="leave-history-footer">
                <span className="leave-history-result-text">
                  Showing {filteredLeaves.length} of{" "}
                  {leaves.length} leave request
                  {leaves.length === 1 ? "" : "s"}
                </span>

                <span className="leave-history-result-text">
                  Only Pending requests can be cancelled.
                </span>
              </div>
            </>

          )}

        </section>

      </div>
    </div>
  );
}

export default LeaveHistory;