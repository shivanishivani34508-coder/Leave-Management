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
    const token = sessionStorage.getItem("token");

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
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

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
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
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

    return parsedDate.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
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

    return parsedDate.toLocaleDateString(
      "en-GB"
    );
  };

  /* =========================================================
     GET REQUIRED APPROVALS

     NORMAL EMPLOYEE:

     0.5 - 2 days
       Manager

     3 - 5 days
       Manager -> Department Head

     6+ days
       Manager -> Department Head -> HR

     MANAGER SELF LEAVE:
       Department Head -> HR

     DEPARTMENT HEAD SELF LEAVE:
       HR

     HR SELF LEAVE:
       Admin

     ADMIN SELF LEAVE:
       Admin
  ========================================================= */

  const getRequiredApprovals = (leave) => {
    /*
      Always use database value when available.
    */

    if (
      Array.isArray(
        leave?.requiredApprovals
      ) &&
      leave.requiredApprovals.length > 0
    ) {
      return leave.requiredApprovals;
    }

    /*
      Fallback for older records.
    */

    const employee = getEmployee(leave);

    const employeeRole =
      employee?.role;

    const totalDays =
      Number(leave?.totalDays) || 0;

    /*
      Manager's own leave
    */

    if (employeeRole === "manager") {
      return [
        "DepartmentHead",
        "HR",
      ];
    }

    /*
      Department Head's own leave
    */

    if (
      employeeRole ===
      "departmentHead"
    ) {
      return ["HR"];
    }

    /*
      HR's own leave
    */

    if (employeeRole === "hr") {
      return ["Admin"];
    }

    /*
      Admin's own leave
    */

    if (employeeRole === "admin") {
      return ["Admin"];
    }

    /*
      Normal employee
    */

    if (totalDays > 5) {
      return [
        "Manager",
        "DepartmentHead",
        "HR",
      ];
    }

    if (totalDays > 2) {
      return [
        "Manager",
        "DepartmentHead",
      ];
    }

    return ["Manager"];
  };

  /* =========================================================
     GET CURRENT WAITING APPROVAL
  ========================================================= */

  const getWaitingStage = (leave) => {
    const requiredApprovals =
      getRequiredApprovals(leave);

    /*
      Manager
    */

    if (
      requiredApprovals.includes(
        "Manager"
      ) &&
      leave?.managerStatus !==
        "Approved"
    ) {
      return "Manager";
    }

    /*
      Department Head
    */

    if (
      requiredApprovals.includes(
        "DepartmentHead"
      ) &&
      leave?.departmentHeadStatus !==
        "Approved"
    ) {
      return "Department Head";
    }

    /*
      HR
    */

    if (
      requiredApprovals.includes("HR") &&
      leave?.hrStatus !== "Approved"
    ) {
      return "HR";
    }

    /*
      Admin
    */

    if (
      requiredApprovals.includes("Admin") &&
      leave?.adminStatus !== "Approved"
    ) {
      return "Admin";
    }

    return null;
  };

  /* =========================================================
     CHECK FULL APPROVAL

     Only required approval stages are checked.
  ========================================================= */

  const isFullyApproved = (leave) => {
    const requiredApprovals =
      getRequiredApprovals(leave);

    return requiredApprovals.every(
      (approval) => {
        if (approval === "Manager") {
          return (
            leave?.managerStatus ===
            "Approved"
          );
        }

        if (
          approval ===
          "DepartmentHead"
        ) {
          return (
            leave?.departmentHeadStatus ===
            "Approved"
          );
        }

        if (approval === "HR") {
          return (
            leave?.hrStatus ===
            "Approved"
          );
        }

        if (approval === "Admin") {
          return (
            leave?.adminStatus ===
            "Approved"
          );
        }

        return true;
      }
    );
  };

  /* =========================================================
     FETCH ALL LEAVES

     Admin can view all leave requests.
  ========================================================= */

  const fetchLeaves = useCallback(
    async () => {
      try {
        setLoading(true);
        setMessage("");

        const token =
          sessionStorage.getItem("token");

        if (!token) {
          handleUnauthorized();
          return;
        }

        const response =
          await api.get(
            "/leaves",
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const leaveData =
          Array.isArray(response.data)
            ? response.data
            : response.data?.leaves ||
              [];

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
          error.response?.status ===
            401 ||
          error.response?.status ===
            403
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
    },
    [handleUnauthorized]
  );

  /* =========================================================
     ADMIN APPROVAL

     IMPORTANT:

     Admin can approve/reject ONLY HR self-leave.

     Normal employee leave is NOT approved
     by Admin.
  ========================================================= */

  const handleAdminStatusUpdate = async (
    leaveId,
    newStatus
  ) => {
    if (
      !leaveId ||
      updatingLeaveId
    ) {
      return;
    }

    const selectedLeave =
      leaves.find(
        (leave) =>
          leave?._id === leaveId
      );

    if (!selectedLeave) {
      setMessageType("error");

      setMessage(
        "Leave request not found."
      );

      return;
    }

    const employee =
      getEmployee(selectedLeave);

    const isHRLeave =
      employee?.role === "hr";

    const requiresAdmin =
      getRequiredApprovals(
        selectedLeave
      ).includes("Admin");

    const adminPending =
      selectedLeave?.adminStatus ===
      "Pending";

    /*
      Security check on frontend.

      Only HR self-leave that requires
      Admin approval can be processed here.
    */

    if (
      !isHRLeave ||
      !requiresAdmin ||
      !adminPending
    ) {
      setMessageType("error");

      setMessage(
        "Admin can only approve or reject HR self-leave."
      );

      return;
    }

    const employeeName =
      employee?.name ||
      "HR employee";

    const leaveType =
      selectedLeave?.leaveType ||
      "leave";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${newStatus.toLowerCase()} ${employeeName}'s ${leaveType} request?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setUpdatingLeaveId(
        leaveId
      );

      setMessage("");

      const response =
        await api.put(
          `/leaves/${leaveId}/admin`,
          {
            status: newStatus,
          },
          getAuthConfig()
        );

      console.log(
        "ADMIN LEAVE UPDATE:",
        response.data
      );

      setMessageType("success");

      setMessage(
        `HR leave ${newStatus.toLowerCase()} successfully by Admin.`
      );

      await fetchLeaves();
    } catch (error) {
      console.error(
        "ADMIN LEAVE UPDATE ERROR:",
        error
      );

      if (
        error.response?.status ===
          401 ||
        error.response?.status ===
          403
      ) {
        handleUnauthorized();
        return;
      }

      setMessageType("error");

      setMessage(
        error.response?.data?.message ||
          "Unable to process HR leave request."
      );
    } finally {
      setUpdatingLeaveId(null);
    }
  };

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
        const status =
          String(
            leave?.status || ""
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
          Number(
            leave?.totalDays
          ) || 0;

        result.paidDays +=
          Number(
            leave?.paidDays
          ) || 0;

        result.unpaidDays +=
          Number(
            leave?.unpaidDays
          ) || 0;

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
     SEARCH + FILTER + SORT
  ========================================================= */

  const filteredLeaves = useMemo(() => {
    const normalizedSearch =
      searchTerm
        .trim()
        .toLowerCase();

    return [...leaves]
      .filter((leave) => {
        const employee =
          getEmployee(leave);

        const employeeName =
          String(
            employee?.name || ""
          ).toLowerCase();

        const employeeEmail =
          String(
            employee?.email || ""
          ).toLowerCase();

        const department =
          String(
            employee?.department ||
              leave?.department ||
              ""
          ).toLowerCase();

        const leaveType =
          String(
            leave?.leaveType || ""
          ).toLowerCase();

        const reason =
          String(
            leave?.reason || ""
          ).toLowerCase();

        const status =
          String(
            leave?.status || ""
          ).toLowerCase();

        const matchesSearch =
          !normalizedSearch ||
          employeeName.includes(
            normalizedSearch
          ) ||
          employeeEmail.includes(
            normalizedSearch
          ) ||
          department.includes(
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
        (
          firstLeave,
          secondLeave
        ) => {
          const firstDate =
            new Date(
              firstLeave.createdAt ||
                firstLeave.startDate ||
                0
            );

          const secondDate =
            new Date(
              secondLeave.createdAt ||
                secondLeave.startDate ||
                0
            );

          return (
            secondDate -
            firstDate
          );
        }
      );
  }, [
    leaves,
    searchTerm,
    statusFilter,
  ]);

  /* =========================================================
     STATUS CLASS
  ========================================================= */

  const getStatusClass = (status) => {
    const normalizedStatus =
      String(
        status || ""
      ).toLowerCase();

    if (
      normalizedStatus ===
      "approved"
    ) {
      return "approved";
    }

    if (
      normalizedStatus ===
      "rejected"
    ) {
      return "rejected";
    }

    return "pending";
  };

  /* =========================================================
     LEAVE BALANCE ALLOCATION LABEL
  ========================================================= */

  const getAllocationLabel = (leave) => {
    const status =
      String(
        leave?.status || ""
      ).toLowerCase();

    if (status === "rejected") {
      return "Not Deducted";
    }

    if (status === "pending") {
      return "Awaiting Review";
    }

    if (
      status === "approved" &&
      leave?.balanceDeducted === true
    ) {
      return "Balance Deducted";
    }

    return "Historical / Not Deducted";
  };

  /* =========================================================
     LEAVE BALANCE ALLOCATION CLASS
  ========================================================= */

  const getAllocationClass = (
    leave
  ) => {
    const status =
      String(
        leave?.status || ""
      ).toLowerCase();

    if (
      status === "approved" &&
      leave?.balanceDeducted === true
    ) {
      return "deducted";
    }

    if (status === "pending") {
      return "awaiting";
    }

    return "not-deducted";
  };

  /* =========================================================
     APPROVAL STATUS CLASS
  ========================================================= */

  const getApprovalClass = (
    status
  ) => {
    if (status === "Approved") {
      return "approved";
    }

    if (status === "Rejected") {
      return "rejected";
    }

    return "pending";
  };

  /* =========================================================
     APPROVAL STATUS ICON
  ========================================================= */

  const getApprovalIcon = (
    status
  ) => {
    if (status === "Approved") {
      return "✓";
    }

    if (status === "Rejected") {
      return "✕";
    }

    return "⏳";
  };

  /* =========================================================
     EXCEL EXPORT
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

            const requiredApprovals =
              getRequiredApprovals(
                leave
              );

            return {
              "Sl. No.":
                index + 1,

              "Employee Name":
                employee?.name ||
                "Unknown Employee",

              "Employee Email":
                employee?.email ||
                "Email unavailable",

              Department:
                employee?.department ||
                leave?.department ||
                "-",

              Role:
                employee?.role ||
                "-",

              "Leave Type":
                leave?.leaveType ||
                "-",

              "Start Date":
                formatExcelDate(
                  leave?.startDate
                ),

              "End Date":
                formatExcelDate(
                  leave?.endDate
                ),

              "Total Days":
                Number(
                  leave?.totalDays
                ) || 0,

              "Paid Days":
                Number(
                  leave?.paidDays
                ) || 0,

              "Unpaid Days":
                Number(
                  leave?.unpaidDays
                ) || 0,

              Reason:
                leave?.reason ||
                "-",

              Status:
                leave?.status ||
                "Pending",

              "Required Approvals":
                requiredApprovals.join(
                  " → "
                ),

              "Manager Status":
                leave?.managerStatus ||
                "Pending",

              "Department Head Status":
                leave?.departmentHeadStatus ||
                "Pending",

              "HR Status":
                leave?.hrStatus ||
                "Pending",

              "Admin Status":
                leave?.adminStatus ||
                "Not Required",

              Allocation:
                getAllocationLabel(
                  leave
                ),

              "Applied Date":
                formatExcelDate(
                  leave?.createdAt
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
        { wch: 18 },
        { wch: 20 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 35 },
        { wch: 14 },
        { wch: 35 },
        { wch: 18 },
        { wch: 24 },
        { wch: 18 },
        { wch: 25 },
        { wch: 16 },
        { wch: 18 },
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
            Loading employee leave
            requests...
          </span>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
  ========================================================= */

  return (
    <div className="manage-leaves-page">
      <div className="manage-leaves-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="manage-leaves-header">
          <div className="manage-leaves-header-content">

            <span className="manage-leaves-label">
              ⚙ Admin Workspace
            </span>

            <h1 className="manage-leaves-title">
              Manage Leaves
            </h1>

            <p className="manage-leaves-description">
              Monitor all employee leave
              requests and track their
              Manager, Department Head,
              HR and Admin approval
              progress.
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

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div
            className={`manage-leaves-message ${messageType}`}
          >
            {message}
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="manage-leaves-stats-grid">

          {/* TOTAL */}

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

          {/* PENDING */}

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

          {/* APPROVED */}

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

          {/* REJECTED */}

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

        {/* =================================================
            DAYS SUMMARY
        ================================================= */}

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

        {/* =================================================
            APPROVAL WORKFLOW SUMMARY
        ================================================= */}

        <section className="admin-final-summary">

          {/* 0.5 - 2 DAYS */}

          <div className="admin-final-summary-card">
            <span className="admin-final-summary-icon">
              1
            </span>

            <div>
              <strong>
                Manager
              </strong>

              <span>
                0.5–2 days
              </span>
            </div>
          </div>

          {/* 3 - 5 DAYS */}

          <div className="admin-final-summary-card">
            <span className="admin-final-summary-icon">
              2
            </span>

            <div>
              <strong>
                Manager → Department Head
              </strong>

              <span>
                3–5 days
              </span>
            </div>
          </div>

          {/* 6+ DAYS */}

          <div className="admin-final-summary-card">
            <span className="admin-final-summary-icon">
              3
            </span>

            <div>
              <strong>
                Manager → Department Head → HR
              </strong>

              <span>
                6+ days
              </span>
            </div>
          </div>

          {/* HR SELF LEAVE */}

          <div className="admin-final-summary-card">
            <span className="admin-final-summary-icon">
              4
            </span>

            <div>
              <strong>
                HR → Admin
              </strong>

              <span>
                HR self-leave
              </span>
            </div>
          </div>

        </section>

        {/* =================================================
            LEAVE REQUEST SECTION
        ================================================= */}

        <section className="manage-leaves-section">

          <div className="manage-leaves-section-header">

            <div>
              <h2 className="manage-leaves-section-title">
                Employee Leave Requests
              </h2>

              <p className="manage-leaves-section-subtitle">
                All employee leave
                applications are visible
                to Admin for monitoring.
                Approval is handled by
                the appropriate Manager,
                Department Head and HR.
                HR self-leave is handled
                by Admin.
              </p>
            </div>

            {/* =================================================
                TOOLBAR
            ================================================= */}

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

          {/* =================================================
              NO LEAVE REQUESTS
          ================================================= */}

          {filteredLeaves.length === 0 ? (
            <div className="manage-leaves-empty">

              <div className="manage-leaves-empty-icon">
                📋
              </div>

              <h3>
                No Leave Requests Found
              </h3>

              <p>
                No leave requests match
                your current search or
                filter.
              </p>

            </div>
          ) : (
            <>

              {/* =================================================
                  LEAVE REQUEST TABLE
              ================================================= */}

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

                        const requiredApprovals =
                          getRequiredApprovals(
                            leave
                          );

                        const waitingStage =
                          getWaitingStage(
                            leave
                          );

                        const fullyApproved =
                          isFullyApproved(
                            leave
                          );

                        const leaveStatus =
                          String(
                            leave?.status ||
                              ""
                          ).toLowerCase();

                        const isHRLeave =
                          employee?.role ===
                          "hr";

                        const needsAdminApproval =
                          isHRLeave &&
                          requiredApprovals.includes(
                            "Admin"
                          ) &&
                          leave?.adminStatus ===
                            "Pending";

                        const isUpdating =
                          updatingLeaveId ===
                          leave?._id;

                        return (
                          <tr
                            key={
                              leave?._id
                            }
                          >

                            {/* =================================================
                                EMPLOYEE
                            ================================================= */}

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

                                  {employee?.department && (
                                    <span className="manage-leaves-employee-department">
                                      {employee.department}
                                    </span>
                                  )}

                                </div>

                              </div>

                            </td>

                            {/* =================================================
                                LEAVE TYPE
                            ================================================= */}

                            <td>

                              <span className="manage-leaves-type">
                                {leave?.leaveType ||
                                  "-"}
                              </span>

                            </td>

                            {/* =================================================
                                DATES
                            ================================================= */}

                            <td>

                              <div className="manage-leaves-date-range">

                                <span>
                                  {formatDate(
                                    leave?.startDate
                                  )}
                                </span>

                                <span className="manage-leaves-date-separator">
                                  →
                                </span>

                                <span>
                                  {formatDate(
                                    leave?.endDate
                                  )}
                                </span>

                              </div>

                            </td>

                            {/* =================================================
                                TOTAL DAYS
                            ================================================= */}

                            <td>

                              <span className="manage-leaves-total-days">
                                {Number(
                                  leave?.totalDays
                                ) || 0}
                              </span>

                            </td>

                            {/* =================================================
                                PAID DAYS
                            ================================================= */}

                            <td>

                              <span className="manage-leaves-paid-days">
                                {Number(
                                  leave?.paidDays
                                ) || 0}
                              </span>

                            </td>

                            {/* =================================================
                                UNPAID DAYS
                            ================================================= */}

                            <td>

                              <span className="manage-leaves-unpaid-days">
                                {Number(
                                  leave?.unpaidDays
                                ) || 0}
                              </span>

                            </td>

                            {/* =================================================
                                REASON
                            ================================================= */}

                            <td>

                              <span
                                className="manage-leaves-reason"
                                title={
                                  leave?.reason ||
                                  ""
                                }
                              >
                                {leave?.reason ||
                                  "-"}
                              </span>

                            </td>

                            {/* =================================================
                                OVERALL STATUS
                            ================================================= */}

                            <td>

                              <span
                                className={`manage-leaves-status ${getStatusClass(
                                  leave?.status
                                )}`}
                              >
                                {leave?.status ||
                                  "Pending"}
                              </span>

                            </td>

                            {/* =================================================
                                APPROVAL FLOW
                            ================================================= */}

                            <td>

                              <div className="admin-approval-flow">

                                {/* MANAGER */}

                                {requiredApprovals.includes(
                                  "Manager"
                                ) && (
                                  <span
                                    className={`admin-approval-stage ${getApprovalClass(
                                      leave?.managerStatus
                                    )}`}
                                  >

                                    <span>
                                      {getApprovalIcon(
                                        leave?.managerStatus
                                      )}
                                    </span>

                                    Manager:{" "}
                                    {leave?.managerStatus ||
                                      "Pending"}

                                  </span>
                                )}

                                {/* DEPARTMENT HEAD */}

                                {requiredApprovals.includes(
                                  "DepartmentHead"
                                ) && (
                                  <span
                                    className={`admin-approval-stage ${getApprovalClass(
                                      leave?.departmentHeadStatus
                                    )}`}
                                  >

                                    <span>
                                      {getApprovalIcon(
                                        leave?.departmentHeadStatus
                                      )}
                                    </span>

                                    Department Head:{" "}
                                    {leave?.departmentHeadStatus ||
                                      "Pending"}

                                  </span>
                                )}

                                {/* HR */}

                                {requiredApprovals.includes(
                                  "HR"
                                ) && (
                                  <span
                                    className={`admin-approval-stage ${getApprovalClass(
                                      leave?.hrStatus
                                    )}`}
                                  >

                                    <span>
                                      {getApprovalIcon(
                                        leave?.hrStatus
                                      )}
                                    </span>

                                    HR:{" "}
                                    {leave?.hrStatus ||
                                      "Pending"}

                                  </span>
                                )}

                                {/* ADMIN */}

                                {requiredApprovals.includes(
                                  "Admin"
                                ) && (
                                  <span
                                    className={`admin-approval-stage ${getApprovalClass(
                                      leave?.adminStatus
                                    )}`}
                                  >

                                    <span>
                                      {getApprovalIcon(
                                        leave?.adminStatus
                                      )}
                                    </span>

                                    Admin:{" "}
                                    {leave?.adminStatus ||
                                      "Pending"}

                                  </span>
                                )}

                              </div>

                            </td>

                            {/* =================================================
                                BALANCE ALLOCATION
                            ================================================= */}

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

                            {/* =================================================
                                ACTIONS

                                ADMIN CAN PROCESS ONLY
                                HR SELF-LEAVE.
                            ================================================= */}

                            <td>

                              {needsAdminApproval ? (

                                <div className="manage-leaves-actions">

                                  <button
                                    type="button"
                                    className="manage-leaves-approve-btn"
                                    disabled={
                                      isUpdating
                                    }
                                    onClick={() =>
                                      handleAdminStatusUpdate(
                                        leave._id,
                                        "Approved"
                                      )
                                    }
                                  >
                                    {isUpdating
                                      ? "Updating..."
                                      : "✓ Approve"}
                                  </button>

                                  <button
                                    type="button"
                                    className="manage-leaves-reject-btn"
                                    disabled={
                                      isUpdating
                                    }
                                    onClick={() =>
                                      handleAdminStatusUpdate(
                                        leave._id,
                                        "Rejected"
                                      )
                                    }
                                  >
                                    {isUpdating
                                      ? "Updating..."
                                      : "✕ Reject"}
                                  </button>

                                </div>

                              ) : leaveStatus ===
                                "rejected" ? (

                                <span className="manage-leaves-reviewed-text rejected-text">
                                  ✕ Rejected
                                </span>

                              ) : fullyApproved ? (

                                <span className="manage-leaves-reviewed-text approved-text">
                                  ✓ Fully Approved
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
                  TABLE FOOTER
              ================================================= */}

              <div className="manage-leaves-footer">

                <span className="manage-leaves-result-text">

                  Showing{" "}
                  {filteredLeaves.length}{" "}
                  of{" "}
                  {leaves.length}{" "}
                  leave request
                  {leaves.length === 1
                    ? ""
                    : "s"}

                </span>

                <span className="manage-leaves-result-text">

                  {statistics.pending >
                  0
                    ? `${statistics.pending} leave request${
                        statistics.pending ===
                        1
                          ? ""
                          : "s"
                      } currently pending approval.`
                    : "No pending leave requests."}

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
