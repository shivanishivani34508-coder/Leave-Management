import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import api from "../services/api";
import "./ManageLeaves.css";

function ManageLeaves() {
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingLeaveId, setUpdatingLeaveId] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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
     LOGOUT WHEN TOKEN IS INVALID
  ========================================================= */

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", {
      replace: true,
    });
  }, [navigate]);

  /* =========================================================
     GET EMPLOYEE OBJECT
  ========================================================= */

  const getEmployee = (leave) => {
    if (
      leave?.employee &&
      typeof leave.employee === "object"
    ) {
      return leave.employee;
    }

    return null;
  };

  /* =========================================================
     GET INITIALS
  ========================================================= */

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     FORMAT EXCEL DATE
  ========================================================= */

  const formatExcelDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-GB");
  };

  /* =========================================================
     FETCH ALL LEAVES
  ========================================================= */

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await api.get(
        "/leaves",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const leaveData = Array.isArray(response.data)
        ? response.data
        : response.data?.leaves || [];

      console.log(
        "ADMIN - ALL LEAVES:",
        leaveData
      );

      setLeaves(leaveData);
    } catch (error) {
      console.error(
        "FETCH ALL LEAVES ERROR:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Unable to load employee leave requests."
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    return leaves.reduce(
      (result, leave) => {
        const status = String(
          leave.status || ""
        ).toLowerCase();

        result.totalRequests += 1;

        if (status === "pending") {
          result.pending += 1;
        }

        if (status === "approved") {
          result.approved += 1;
        }

        if (status === "rejected") {
          result.rejected += 1;
        }

        result.requestedDays +=
          Number(leave.totalDays) || 0;

        result.paidDays +=
          Number(leave.paidDays) || 0;

        result.unpaidDays +=
          Number(leave.unpaidDays) || 0;

        return result;
      },
      {
        totalRequests: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        requestedDays: 0,
        paidDays: 0,
        unpaidDays: 0,
      }
    );
  }, [leaves]);

  /* =========================================================
     ADMIN FINAL APPROVAL CHECK
     
     Admin can approve/reject ONLY when:
     
     Manager          = Approved
     Department Head  = Approved
     HR               = Approved
     Admin            = Pending
  ========================================================= */

  const isReadyForAdmin = (leave) => {
    return (
      leave?.managerStatus === "Approved" &&
      leave?.departmentHeadStatus === "Approved" &&
      leave?.hrStatus === "Approved" &&
      leave?.adminStatus === "Pending"
    );
  };

  /* =========================================================
     ADMIN PROCESSED CHECK
  ========================================================= */

  const isAdminApproved = (leave) => {
    return leave?.adminStatus === "Approved";
  };

  const isAdminRejected = (leave) => {
    return leave?.adminStatus === "Rejected";
  };

  /* =========================================================
     ADMIN PENDING REQUESTS
  ========================================================= */

  const pendingAdminLeaves = useMemo(() => {
    return leaves.filter(
      (leave) => isReadyForAdmin(leave)
    );
  }, [leaves]);

  /* =========================================================
     ADMIN PROCESSED REQUESTS
  ========================================================= */

  const processedAdminLeaves = useMemo(() => {
    return leaves.filter(
      (leave) =>
        isAdminApproved(leave) ||
        isAdminRejected(leave)
    );
  }, [leaves]);

  /* =========================================================
     SEARCH + FILTER + SORT
  ========================================================= */

  const filteredLeaves = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return [...leaves]
      .filter((leave) => {
        const employee = getEmployee(leave);

        const employeeName = String(
          employee?.name || ""
        ).toLowerCase();

        const employeeEmail = String(
          employee?.email || ""
        ).toLowerCase();

        const leaveType = String(
          leave.leaveType || ""
        ).toLowerCase();

        const reason = String(
          leave.reason || ""
        ).toLowerCase();

        const status = String(
          leave.status || ""
        ).toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          employeeName.includes(
            normalizedSearch
          ) ||
          employeeEmail.includes(
            normalizedSearch
          ) ||
          leaveType.includes(
            normalizedSearch
          ) ||
          reason.includes(
            normalizedSearch
          ) ||
          status.includes(
            normalizedSearch
          );

        const matchesStatus =
          statusFilter === "All" ||
          status ===
            statusFilter.toLowerCase();

        return (
          matchesSearch &&
          matchesStatus
        );
      })
      .sort(
        (firstLeave, secondLeave) => {
          const firstDate = new Date(
            firstLeave.createdAt ||
              firstLeave.startDate ||
              0
          );

          const secondDate = new Date(
            secondLeave.createdAt ||
              secondLeave.startDate ||
              0
          );

          return secondDate - firstDate;
        }
      );
  }, [
    leaves,
    searchTerm,
    statusFilter,
  ]);

  /* =========================================================
     GET STATUS CLASS
  ========================================================= */

  const getStatusClass = (status) => {
    const normalizedStatus =
      String(status || "")
        .toLowerCase();

    if (
      normalizedStatus === "approved"
    ) {
      return "approved";
    }

    if (
      normalizedStatus === "rejected"
    ) {
      return "rejected";
    }

    return "pending";
  };

  /* =========================================================
     ALLOCATION LABEL
  ========================================================= */

  const getAllocationLabel = (leave) => {
    const status = String(
      leave.status || ""
    ).toLowerCase();

    if (status === "rejected") {
      return "Not Deducted";
    }

    if (status === "pending") {
      return "Awaiting Review";
    }

    if (
      status === "approved" &&
      leave.balanceDeducted === true
    ) {
      return "Balance Deducted";
    }

    return "Historical / Not Deducted";
  };

  /* =========================================================
     ALLOCATION CLASS
  ========================================================= */

  const getAllocationClass = (leave) => {
    const status = String(
      leave.status || ""
    ).toLowerCase();

    if (
      status === "approved" &&
      leave.balanceDeducted === true
    ) {
      return "deducted";
    }

    if (status === "pending") {
      return "awaiting";
    }

    return "not-deducted";
  };

  /* =========================================================
     APPROVAL STAGE CLASS
  ========================================================= */

  const getApprovalClass = (status) => {
    if (status === "Approved") {
      return "approved";
    }

    if (status === "Rejected") {
      return "rejected";
    }

    return "pending";
  };

  /* =========================================================
     APPROVAL STAGE TEXT
  ========================================================= */

  const getApprovalIcon = (status) => {
    if (status === "Approved") {
      return "✓";
    }

    if (status === "Rejected") {
      return "✕";
    }

    return "⏳";
  };

  /* =========================================================
     WHO IS CURRENTLY WAITING?
  ========================================================= */

  const getWaitingStage = (leave) => {
    if (
      leave.managerStatus !== "Approved"
    ) {
      return "Manager";
    }

    if (
      leave.departmentHeadStatus !==
      "Approved"
    ) {
      return "Department Head";
    }

    if (
      leave.hrStatus !== "Approved"
    ) {
      return "HR";
    }

    if (
      leave.adminStatus !== "Approved"
    ) {
      return "Admin";
    }

    return null;
  };

  /* =========================================================
     APPROVE / REJECT LEAVE
  ========================================================= */

  const handleStatusUpdate = async (
    leaveId,
    newStatus
  ) => {
    if (!leaveId || updatingLeaveId) {
      return;
    }

    const selectedLeave = leaves.find(
      (leave) =>
        leave._id === leaveId
    );

    if (!selectedLeave) {
      setMessageType("error");

      setMessage(
        "Leave request not found."
      );

      return;
    }

    /*
      Frontend safety check.

      Admin can only take final action after:
      Manager + Department Head + HR
      have approved the request.
    */

    if (
      !isReadyForAdmin(
        selectedLeave
      )
    ) {
      setMessageType("error");

      setMessage(
        "This leave is not ready for Admin approval. Manager, Department Head and HR must approve it first."
      );

      return;
    }

    const employee =
      getEmployee(selectedLeave);

    const confirmed =
      window.confirm(
        `Are you sure you want to ${newStatus.toLowerCase()} ` +
          `${employee?.name || "this employee"}'s ` +
          `${selectedLeave.leaveType || ""} leave request?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingLeaveId(leaveId);
      setMessage("");

      const response =
        await api.put(
          `/leaves/${leaveId}/status`,
          {
            status: newStatus,
          },
          getAuthConfig()
        );

      console.log(
        "ADMIN STATUS UPDATE:",
        response.data
      );

      setMessageType("success");

      setMessage(
        `Leave ${newStatus.toLowerCase()} successfully.`
      );

      /*
        Fetch fresh data so the frontend
        receives the latest:
        - status
        - paidDays
        - unpaidDays
        - balanceDeducted
        - approval statuses
      */

      await fetchLeaves();
    } catch (error) {
      console.error(
        "ADMIN APPROVAL ERROR:",
        error
      );

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Unable to update leave status."
      );
    } finally {
      setUpdatingLeaveId(null);
    }
  };

  /* =========================================================
     EXPORT TO EXCEL
  ========================================================= */

  const handleExportExcel = () => {
    try {
      if (
        filteredLeaves.length === 0
      ) {
        setMessageType("error");

        setMessage(
          "There are no leave records to export."
        );

        return;
      }

      const exportData =
        filteredLeaves.map(
          (leave, index) => {
            const employee =
              getEmployee(leave);

            return {
              "Sl. No.": index + 1,

              "Employee Name":
                employee?.name ||
                "Unknown Employee",

              "Employee Email":
                employee?.email ||
                "Email unavailable",

              Department:
                employee?.department ||
                leave.department ||
                "-",

              "Leave Type":
                leave.leaveType || "-",

              "Start Date":
                formatExcelDate(
                  leave.startDate
                ),

              "End Date":
                formatExcelDate(
                  leave.endDate
                ),

              "Total Days":
                Number(
                  leave.totalDays
                ) || 0,

              "Paid Days":
                Number(
                  leave.paidDays
                ) || 0,

              "Unpaid Days":
                Number(
                  leave.unpaidDays
                ) || 0,

              Reason:
                leave.reason || "-",

              Status:
                leave.status ||
                "Pending",

              "Manager Status":
                leave.managerStatus ||
                "Pending",

              "Department Head Status":
                leave.departmentHeadStatus ||
                "Pending",

              "HR Status":
                leave.hrStatus ||
                "Pending",

              "Admin Status":
                leave.adminStatus ||
                "Pending",

              Allocation:
                getAllocationLabel(
                  leave
                ),

              "Applied Date":
                formatExcelDate(
                  leave.createdAt
                ),
            };
          }
        );

      const worksheet =
        XLSX.utils.json_to_sheet(
          exportData
        );

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 24 },
        { wch: 30 },
        { wch: 18 },
        { wch: 20 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 35 },
        { wch: 14 },
        { wch: 18 },
        { wch: 24 },
        { wch: 16 },
        { wch: 16 },
        { wch: 25 },
        { wch: 16 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Leave Requests"
      );

      XLSX.writeFile(
        workbook,
        "Employee_Leave_Requests.xlsx"
      );

      setMessageType("success");

      setMessage(
        "Leave records exported successfully."
      );
    } catch (error) {
      console.error(
        "EXPORT EXCEL ERROR:",
        error
      );

      setMessageType("error");

      setMessage(
        "Unable to export leave records."
      );
    }
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <div className="manage-leaves-page">

        <div className="manage-leaves-loading">

          <div className="manage-leaves-spinner" />

          <span className="manage-leaves-loading-text">
            Loading employee leave requests...
          </span>

        </div>

      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="manage-leaves-page">

      <div className="manage-leaves-container">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <header className="manage-leaves-header">

          <div className="manage-leaves-header-content">

            <span className="manage-leaves-label">
              ⚙ Admin Workspace
            </span>

            <h1 className="manage-leaves-title">
              Manage Leaves
            </h1>

            <p className="manage-leaves-description">
              Review all employee leave requests and
              complete the final approval after Manager,
              Department Head and HR approval.
            </p>

          </div>

          <button
            type="button"
            className="manage-leaves-back-btn"
            onClick={() =>
              navigate(
                "/admin-dashboard"
              )
            }
          >
            ← Back to Admin Dashboard
          </button>

        </header>

        {/* =====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`manage-leaves-message ${messageType}`}
          >
            {message}
          </div>
        )}

        {/* =====================================================
            REQUEST STATISTICS
        ===================================================== */}

        <section className="manage-leaves-stats-grid">

          <article className="manage-leaves-stat-card">

            <div className="manage-leaves-stat-icon total">
              📄
            </div>

            <div className="manage-leaves-stat-content">

              <span className="manage-leaves-stat-label">
                Total Requests
              </span>

              <h2 className="manage-leaves-stat-value">
                {statistics.totalRequests}
              </h2>

            </div>

          </article>

          <article className="manage-leaves-stat-card">

            <div className="manage-leaves-stat-icon pending">
              ⏳
            </div>

            <div className="manage-leaves-stat-content">

              <span className="manage-leaves-stat-label">
                Pending
              </span>

              <h2 className="manage-leaves-stat-value">
                {statistics.pending}
              </h2>

            </div>

          </article>

          <article className="manage-leaves-stat-card">

            <div className="manage-leaves-stat-icon approved">
              ✓
            </div>

            <div className="manage-leaves-stat-content">

              <span className="manage-leaves-stat-label">
                Approved
              </span>

              <h2 className="manage-leaves-stat-value">
                {statistics.approved}
              </h2>

            </div>

          </article>

          <article className="manage-leaves-stat-card">

            <div className="manage-leaves-stat-icon rejected">
              ✕
            </div>

            <div className="manage-leaves-stat-content">

              <span className="manage-leaves-stat-label">
                Rejected
              </span>

              <h2 className="manage-leaves-stat-value">
                {statistics.rejected}
              </h2>

            </div>

          </article>

        </section>

        {/* =====================================================
            DAY STATISTICS
        ===================================================== */}

        <section className="manage-leaves-days-grid">

          <article className="manage-leaves-day-card">

            <span className="manage-leaves-day-label">
              Requested Days
            </span>

            <strong className="manage-leaves-day-value">
              {statistics.requestedDays}
            </strong>

          </article>

          <article className="manage-leaves-day-card">

            <span className="manage-leaves-day-label">
              Paid Days
            </span>

            <strong className="manage-leaves-day-value">
              {statistics.paidDays}
            </strong>

          </article>

          <article className="manage-leaves-day-card">

            <span className="manage-leaves-day-label">
              Unpaid Days
            </span>

            <strong className="manage-leaves-day-value">
              {statistics.unpaidDays}
            </strong>

          </article>

        </section>

        {/* =====================================================
            ADMIN FINAL APPROVAL SUMMARY
        ===================================================== */}

        <section className="admin-final-summary">

          <div className="admin-final-summary-card">

            <span className="admin-final-summary-icon">
              ⏳
            </span>

            <div>
              <strong>
                {pendingAdminLeaves.length}
              </strong>

              <span>
                Ready for Admin Final Approval
              </span>
            </div>

          </div>

          <div className="admin-final-summary-card">

            <span className="admin-final-summary-icon">
              ✓
            </span>

            <div>
              <strong>
                {
                  processedAdminLeaves.filter(
                    (leave) =>
                      leave.adminStatus ===
                      "Approved"
                  ).length
                }
              </strong>

              <span>
                Admin Approved
              </span>
            </div>

          </div>

          <div className="admin-final-summary-card">

            <span className="admin-final-summary-icon">
              ✕
            </span>

            <div>
              <strong>
                {
                  processedAdminLeaves.filter(
                    (leave) =>
                      leave.adminStatus ===
                      "Rejected"
                  ).length
                }
              </strong>

              <span>
                Admin Rejected
              </span>
            </div>

          </div>

        </section>

        {/* =====================================================
            MAIN LEAVE REQUEST SECTION
        ===================================================== */}

        <section className="manage-leaves-section">

          <div className="manage-leaves-section-header">

            <div>

              <h2 className="manage-leaves-section-title">
                Employee Leave Requests
              </h2>

              <p className="manage-leaves-section-subtitle">
                All employee leave applications are visible
                to Admin. Final action is available only after
                all previous approval stages are completed.
              </p>

            </div>

            <div className="manage-leaves-toolbar">

              <button
                type="button"
                className="manage-leaves-export-btn"
                onClick={
                  handleExportExcel
                }
              >
                📊 Export Excel
              </button>

              <input
                type="text"
                className="manage-leaves-search"
                placeholder="🔍 Search employee or leave..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
              />

              <select
                className="manage-leaves-status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
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

            <div className="manage-leaves-empty">

              <div className="manage-leaves-empty-icon">
                📋
              </div>

              <h3>
                No Leave Requests Found
              </h3>

              <p>
                No leave requests match your
                current search or filter.
              </p>

            </div>

          ) : (

            <>

              <div className="manage-leaves-table-wrapper">

                <table className="manage-leaves-table">

                  <thead>

                    <tr>

                      <th>
                        EMPLOYEE
                      </th>

                      <th>
                        LEAVE TYPE
                      </th>

                      <th>
                        DATES
                      </th>

                      <th>
                        TOTAL
                      </th>

                      <th>
                        PAID
                      </th>

                      <th>
                        UNPAID
                      </th>

                      <th>
                        REASON
                      </th>

                      <th>
                        STATUS
                      </th>

                      <th>
                        APPROVAL FLOW
                      </th>

                      <th>
                        ALLOCATION
                      </th>

                      <th>
                        ACTIONS
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredLeaves.map(
                      (leave) => {

                        const employee =
                          getEmployee(
                            leave
                          );

                        const isReady =
                          isReadyForAdmin(
                            leave
                          );

                        const isUpdating =
                          updatingLeaveId ===
                          leave._id;

                        const waitingStage =
                          getWaitingStage(
                            leave
                          );

                        return (
                          <tr
                            key={
                              leave._id
                            }
                          >

                            {/* EMPLOYEE */}

                            <td>

                              <div className="manage-leaves-employee-cell">

                                <div className="manage-leaves-employee-avatar">
                                  {getInitials(
                                    employee?.name
                                  )}
                                </div>

                                <div className="manage-leaves-employee-info">

                                  <span className="manage-leaves-employee-name">
                                    {employee?.name ||
                                      "Unknown Employee"}
                                  </span>

                                  <span className="manage-leaves-employee-email">
                                    {employee?.email ||
                                      "Email unavailable"}
                                  </span>

                                </div>

                              </div>

                            </td>

                            {/* LEAVE TYPE */}

                            <td>

                              <span className="manage-leaves-type">
                                {leave.leaveType ||
                                  "-"}
                              </span>

                            </td>

                            {/* DATES */}

                            <td>

                              <div className="manage-leaves-date-range">

                                <span>
                                  {formatDate(
                                    leave.startDate
                                  )}
                                </span>

                                <span className="manage-leaves-date-separator">
                                  →
                                </span>

                                <span>
                                  {formatDate(
                                    leave.endDate
                                  )}
                                </span>

                              </div>

                            </td>

                            {/* TOTAL DAYS */}

                            <td>

                              <span className="manage-leaves-total-days">
                                {Number(
                                  leave.totalDays
                                ) || 0}
                              </span>

                            </td>

                            {/* PAID DAYS */}

                            <td>

                              <span className="manage-leaves-paid-days">
                                {Number(
                                  leave.paidDays
                                ) || 0}
                              </span>

                            </td>

                            {/* UNPAID DAYS */}

                            <td>

                              <span className="manage-leaves-unpaid-days">
                                {Number(
                                  leave.unpaidDays
                                ) || 0}
                              </span>

                            </td>

                            {/* REASON */}

                            <td>

                              <span
                                className="manage-leaves-reason"
                                title={
                                  leave.reason ||
                                  ""
                                }
                              >
                                {leave.reason ||
                                  "-"}
                              </span>

                            </td>

                            {/* OVERALL STATUS */}

                            <td>

                              <span
                                className={`manage-leaves-status ${getStatusClass(
                                  leave.status
                                )}`}
                              >
                                {leave.status ||
                                  "Pending"}
                              </span>

                            </td>

                            {/* =================================================
                                APPROVAL FLOW
                            ================================================= */}

                            <td>

                              <div className="admin-approval-flow">

                                <span
                                  className={`admin-approval-stage ${getApprovalClass(
                                    leave.managerStatus
                                  )}`}
                                >
                                  <span>
                                    {getApprovalIcon(
                                      leave.managerStatus
                                    )}
                                  </span>

                                  Manager:{" "}
                                  {leave.managerStatus ||
                                    "Pending"}
                                </span>

                                <span
                                  className={`admin-approval-stage ${getApprovalClass(
                                    leave.departmentHeadStatus
                                  )}`}
                                >
                                  <span>
                                    {getApprovalIcon(
                                      leave.departmentHeadStatus
                                    )}
                                  </span>

                                  Department Head:{" "}
                                  {leave.departmentHeadStatus ||
                                    "Pending"}
                                </span>

                                <span
                                  className={`admin-approval-stage ${getApprovalClass(
                                    leave.hrStatus
                                  )}`}
                                >
                                  <span>
                                    {getApprovalIcon(
                                      leave.hrStatus
                                    )}
                                  </span>

                                  HR:{" "}
                                  {leave.hrStatus ||
                                    "Pending"}
                                </span>

                                <span
                                  className={`admin-approval-stage ${getApprovalClass(
                                    leave.adminStatus
                                  )}`}
                                >
                                  <span>
                                    {getApprovalIcon(
                                      leave.adminStatus
                                    )}
                                  </span>

                                  Admin:{" "}
                                  {leave.adminStatus ||
                                    "Pending"}
                                </span>

                              </div>

                            </td>

                            {/* ALLOCATION */}

                            <td>

                              <span
                                className={`manage-leaves-allocation ${getAllocationClass(
                                  leave
                                )}`}
                              >
                                {getAllocationLabel(
                                  leave
                                )}
                              </span>

                            </td>

                            {/* ACTIONS */}

                            <td>

                              {isReady ? (

                                <div className="manage-leaves-actions">

                                  <button
                                    type="button"
                                    className="manage-leaves-approve-btn"
                                    disabled={
                                      isUpdating
                                    }
                                    onClick={() =>
                                      handleStatusUpdate(
                                        leave._id,
                                        "Approved"
                                      )
                                    }
                                  >
                                    {isUpdating
                                      ? "Updating..."
                                      : "Approve"}
                                  </button>

                                  <button
                                    type="button"
                                    className="manage-leaves-reject-btn"
                                    disabled={
                                      isUpdating
                                    }
                                    onClick={() =>
                                      handleStatusUpdate(
                                        leave._id,
                                        "Rejected"
                                      )
                                    }
                                  >
                                    {isUpdating
                                      ? "Updating..."
                                      : "Reject"}
                                  </button>

                                </div>

                              ) : isAdminApproved(
                                  leave
                                ) ? (

                                <span className="manage-leaves-reviewed-text approved-text">
                                  ✓ Admin Approved
                                </span>

                              ) : isAdminRejected(
                                  leave
                                ) ? (

                                <span className="manage-leaves-reviewed-text rejected-text">
                                  ✕ Admin Rejected
                                </span>

                              ) : (

                                <span className="manage-leaves-waiting-text">

                                  ⏳ Waiting for{" "}
                                  {waitingStage ||
                                    "approval"}

                                </span>

                              )}

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>

              {/* =================================================
                  FOOTER
              ================================================= */}

              <div className="manage-leaves-footer">

                <span className="manage-leaves-result-text">
                  Showing{" "}
                  {
                    filteredLeaves.length
                  }{" "}
                  of{" "}
                  {leaves.length}{" "}
                  leave request
                  {leaves.length ===
                  1
                    ? ""
                    : "s"}
                </span>

                <span className="manage-leaves-result-text">

                  {pendingAdminLeaves.length >
                  0
                    ? `${pendingAdminLeaves.length} leave request${
                        pendingAdminLeaves.length ===
                        1
                          ? ""
                          : "s"
                      } ready for Admin final approval.`
                    : "No leave requests are currently ready for Admin final approval."}

                </span>

              </div>

            </>

          )}

        </section>

      </div>

    </div>
  );
}

export default ManageLeaves;