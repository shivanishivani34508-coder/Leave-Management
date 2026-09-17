import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

import "./Employees.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [selectedEmployee, setSelectedEmployee] =
    useState(null);

  const [savingBalances, setSavingBalances] =
    useState(false);

  const [editBalances, setEditBalances] = useState({
    casual: 0,
    sick: 0,
    earned: 0,
    marriage: 0,
    maternity: 0,
    paternity: 0,
    bereavement: 0,
  });


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
   FETCH USERS
========================================================= */

const fetchEmployees = useCallback(async () => {
  try {
    setLoading(true);
    setError("");

    const token = sessionStorage.getItem("token");

    if (!token) {
      handleUnauthorized();
      return;
    }

    const response = await api.get(
      "/users",
      getAuthConfig()
    );
const users = Array.isArray(response.data)
  ? response.data
  : Array.isArray(response.data?.users)
  ? response.data.users
  : [];

/*
  IMPORTANT:
  Employee Management page should contain
  only employee accounts.

  Managers, Department Heads and HR accounts
  are handled separately.
*/

const employeeUsers = users.filter(
  (user) => user.role === "employee"
);

setEmployees(employeeUsers);

  } catch (error) {
    console.error(
      "FETCH EMPLOYEES ERROR:",
      error
    );

    if (error.response?.status === 401) {
      handleUnauthorized();
      return;
    }

    if (error.response?.status === 403) {
      setError(
        "Access denied. Admin account is required."
      );
      return;
    }

    setError(
      error.response?.data?.message ||
      "Unable to load employees."
    );

  } finally {
    setLoading(false);
  }
}, [handleUnauthorized]);


  /* =========================================================
     LOAD EMPLOYEES
  ========================================================= */

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);


  /* =========================================================
     GET LEAVE BALANCES
  ========================================================= */

  const getBalances = (employee) => {
    const balances =
      employee?.leaveBalance ||
      employee?.leaveBalances ||
      {};

    return {
      casual: Number(balances.casual ?? 0),

      sick: Number(balances.sick ?? 0),

      earned: Number(balances.earned ?? 0),

      marriage: Number(balances.marriage ?? 0),

      maternity: Number(balances.maternity ?? 0),

      paternity: Number(balances.paternity ?? 0),

      bereavement: Number(
        balances.bereavement ?? 0
      ),
    };
  };


  /* =========================================================
     GET STATISTICS
  ========================================================= */

  const getStatistics = (employee) => {
    const statistics = employee?.statistics || {};

    return {
      total: Number(statistics.total ?? 0),

      approved: Number(
        statistics.approved ?? 0
      ),

      pending: Number(statistics.pending ?? 0),
    };
  };


  /* =========================================================
     CLOSE EDIT MODAL
  ========================================================= */

  const closeEditBalance = () => {
    if (savingBalances) {
      return;
    }

    setSelectedEmployee(null);
  };


  /* =========================================================
     HANDLE BALANCE INPUT
  ========================================================= */

  const handleBalanceChange = (event) => {
    const { name, value } = event.target;

    setEditBalances((currentBalances) => ({
      ...currentBalances,

      [name]: value,
    }));
  };


  /* =========================================================
     SAVE LEAVE BALANCES
  ========================================================= */

  const saveLeaveBalances = async (event) => {
    event.preventDefault();

    if (!selectedEmployee?._id) {
      setError("Employee ID is missing.");

      return;
    }

    const updatedBalances = {
      casual: Number(editBalances.casual),

      sick: Number(editBalances.sick),

      earned: Number(editBalances.earned),

      marriage: Number(editBalances.marriage),

      maternity: Number(editBalances.maternity),

      paternity: Number(editBalances.paternity),

      bereavement: Number(
        editBalances.bereavement
      ),
    };

    const invalidValue = Object.values(
      updatedBalances
    ).some(
      (value) =>
        !Number.isFinite(value) || value < 0
    );

    if (invalidValue) {
      setError(
        "All leave balances must be valid non-negative numbers."
      );

      setMessage("");

      return;
    }

    try {
      setSavingBalances(true);

      setError("");

      setMessage("");

      const response = await api.put(
        `/users/${selectedEmployee._id}/leave-balance`,

        updatedBalances,

        getAuthConfig()
      );

      const updatedUser = response.data?.user;

      setEmployees((currentEmployees) =>
        currentEmployees.map((employee) => {
          if (
            employee._id !== selectedEmployee._id
          ) {
            return employee;
          }

          if (updatedUser) {
            return {
              ...employee,

              ...updatedUser,

              statistics:
                employee.statistics || {},
            };
          }

          return {
            ...employee,

            leaveBalance: updatedBalances,
          };
        })
      );

      setMessage(
        response.data?.message ||
          "Leave balances updated successfully."
      );

      setSelectedEmployee(null);
    } catch (error) {
      console.error(
        "UPDATE LEAVE BALANCE ERROR:",
        error
      );

      if (error.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      if (error.response?.status === 403) {
        setError(
          "Access denied. Only admin can update leave balances."
        );

        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to update leave balances."
      );
    } finally {
      setSavingBalances(false);
    }
  };


  /* =========================================================
     DELETE EMPLOYEE
  ========================================================= */

  const deleteEmployee = async (employee) => {
    if (!employee?._id) {
      setError("Employee ID is missing.");

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      setMessage("");

      const response = await api.delete(
        `/users/${employee._id}`,

        getAuthConfig()
      );

      setEmployees((currentEmployees) =>
        currentEmployees.filter(
          (currentEmployee) =>
            currentEmployee._id !== employee._id
        )
      );

      setMessage(
        response.data?.message ||
          "Employee deleted successfully."
      );
    } catch (error) {
      console.error(
        "DELETE EMPLOYEE ERROR:",
        error
      );

      if (error.response?.status === 401) {
        handleUnauthorized();

        return;
      }

      if (error.response?.status === 403) {
        setError(
          "Access denied. Only admin can delete employees."
        );

        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to delete employee."
      );
    }
  };


  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredEmployees = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    if (!searchText) {
      return employees;
    }

    return employees.filter((employee) => {
      const name =
        employee.name?.toLowerCase() || "";

      const email =
        employee.email?.toLowerCase() || "";

      return (
        name.includes(searchText) ||
        email.includes(searchText)
      );
    });
  }, [employees, search]);


  /* =========================================================
     TOTAL STATISTICS
  ========================================================= */

  const totals = useMemo(() => {
    return employees.reduce(
      (result, employee) => {
        const statistics =
          getStatistics(employee);

        result.requests += statistics.total;

        result.approved += statistics.approved;

        result.pending += statistics.pending;

        return result;
      },
      {
        requests: 0,

        approved: 0,

        pending: 0,
      }
    );
  }, [employees]);

/* =========================================================
   EMPLOYEE INITIALS
========================================================= */

const getInitials = (name) => {

  if (!name) {
    return "E";
  }

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[words.length - 1].charAt(0)
  ).toUpperCase();
};


/* =========================================================
   EXPORT PDF
========================================================= */

const exportPDF = () => {

  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Employee Report", 14, 20);

  const tableData = employees.map((employee) => {

    const balances = getBalances(employee);
    const stats = getStatistics(employee);

    return [
      employee.name,
      employee.email,
      balances.casual,
      balances.sick,
      balances.earned,
      balances.marriage,
      stats.total,
      stats.approved,
      stats.pending,
    ];
  });

  autoTable(doc, {
    startY: 30,
    head: [[
      "Name",
      "Email",
      "Casual",
      "Sick",
      "Earned",
      "Marriage",
      "Total",
      "Approved",
      "Pending",
    ]],
    body: tableData,
  });

  doc.save("Employees_Report.pdf");
};

const exportExcel = () => {
  const excelData = employees.map((employee) => {
    const balances = getBalances(employee);
    const stats = getStatistics(employee);

    return {
      Name: employee.name,
      Email: employee.email,
      Role: employee.role,
      Casual: balances.casual,
      Sick: balances.sick,
      Earned: balances.earned,
      Marriage: balances.marriage,
      Maternity: balances.maternity,
      Paternity: balances.paternity,
      Bereavement: balances.bereavement,
      "Total Requests": stats.total,
      Approved: stats.approved,
      Pending: stats.pending,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Employees"
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(file, "Employees_Report.xlsx");
};


/* =========================================================
   PAGE
========================================================= */

return (
    <div className="employees-page">
      <div className="employees-container">

        {/* PAGE HEADER */}

        <section className="employees-hero">
          <div>
            <div className="employees-eyebrow">
              👥 ADMIN WORKSPACE
            </div>

            <h1>Employee Management</h1>

            <p>
              View registered employees, inspect leave
              balances and manage employee accounts.
            </p>
          </div>


          <div className="employees-hero-actions">

  <button
    type="button"
    className="employees-btn employees-btn-secondary"
    onClick={fetchEmployees}
    disabled={loading}
  >
    {loading
      ? "Refreshing..."
      : "↻ Refresh Employees"}
  </button>

  <button
    type="button"
    className="employees-btn employees-btn-primary"
    onClick={exportPDF}
  >
    📄 Export PDF
  </button>

  <button
  type="button"
  className="employees-btn employees-btn-primary"
  onClick={exportExcel}
>
  📊 Export Excel
</button>

  <button
    type="button"
    className="employees-btn employees-btn-primary"
    onClick={() => navigate("/admin-dashboard")}
  >
    ← Back to Dashboard
  </button>

</div>
        </section>


        {/* MESSAGES */}

        {message && (
          <div className="employees-alert employees-alert-success">
            {message}
          </div>
        )}


        {error && (
          <div className="employees-alert employees-alert-error">
            {error}
          </div>
        )}


        {/* STATISTICS */}

        <section className="employees-stats-grid">

          <article className="employees-stat-card">
            <div className="employees-stat-icon">
              👥
            </div>

            <div className="employees-stat-content">
              <span>Total Employees</span>

              <strong>{employees.length}</strong>

              <small>
                Registered employee accounts
              </small>
            </div>
          </article>


          <article className="employees-stat-card">
            <div className="employees-stat-icon">
              📄
            </div>

            <div className="employees-stat-content">
              <span>Leave Requests</span>

              <strong>{totals.requests}</strong>

              <small>
                Employee leave applications
              </small>
            </div>
          </article>


          <article className="employees-stat-card">
            <div className="employees-stat-icon">
              ✓
            </div>

            <div className="employees-stat-content">
              <span>Approved Requests</span>

              <strong>{totals.approved}</strong>

              <small>
                Approved employee requests
              </small>
            </div>
          </article>


          <article className="employees-stat-card">
            <div className="employees-stat-icon">
              ⏳
            </div>

            <div className="employees-stat-content">
              <span>Pending Requests</span>

              <strong>{totals.pending}</strong>

              <small>
                Waiting for admin review
              </small>
            </div>
          </article>

        </section>


        {/* EMPLOYEE TABLE */}

        <section className="employees-card">

          <div className="employees-card-header">

            <div>
              <h2>Registered Employees</h2>

              <p>
                Search employees, review balances and
                manage employee accounts.
              </p>
            </div>


            <div className="employees-search-box">

              <span>🔍</span>

              <input
                type="text"
                placeholder="Search employee name or email"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />


              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

            </div>

          </div>


          {loading ? (

            <div className="employees-state">

              <div className="employees-spinner" />

              <p>Loading employees...</p>

            </div>

          ) : (

            <div className="employees-table-wrapper">

              <table className="employees-table">

                <thead>
                  <tr>
                    <th>Employee</th>

                    <th>Role</th>

                    <th>Casual</th>

                    <th>Sick</th>

                    <th>Earned</th>

                    <th>Marriage</th>

                    <th>Requests</th>

                    <th>Approved</th>

                    <th>Pending</th>

                    <th>Actions</th>
                  </tr>
                </thead>


                <tbody>

                  {filteredEmployees.map(
                    (employee) => {

                      const balances =
                        getBalances(employee);

                      const statistics =
                        getStatistics(employee);


                      return (

                        <tr key={employee._id}>

                          <td>

                            <div className="employees-user">

                              <div className="employees-avatar">
                                {getInitials(
                                  employee.name
                                )}
                              </div>


                              <div className="employees-user-info">

                                <strong>
                                  {employee.name ||
                                    "Employee"}
                                </strong>

                                <span>
                                  {employee.email || "-"}
                                </span>

                              </div>

                            </div>

                          </td>

                          <td>
                            <span className="employees-role">
                              {employee.role === "departmentHead"
                                ? "Department Head"
                                : employee.role === "hr"
                                ? "HR"
                                : employee.role === "manager"
                                ? "Manager"
                                : "Employee"}
                            </span>
                          </td>


                          <td>
                            <span className="employees-balance">
                              {balances.casual}
                            </span>
                          </td>


                          <td>
                            <span className="employees-balance">
                              {balances.sick}
                            </span>
                          </td>


                          <td>
                            <span className="employees-balance">
                              {balances.earned}
                            </span>
                          </td>


                          <td>
                            <span className="employees-balance">
                              {balances.marriage}
                            </span>
                          </td>


                          <td>
                            {statistics.total}
                          </td>


                          <td>
                            {statistics.approved}
                          </td>


                          <td>
                            {statistics.pending}
                          </td>


                          <td>

                         <div className="employees-actions">

  <button
    type="button"
    className="employees-view-btn"
    onClick={() => navigate(`/employees/${employee._id}`)}
  >
    👁 View Details
  </button>

  <button
  type="button"
  className="employees-edit-btn"
  onClick={() =>
    navigate(`/edit-employee/${employee._id}`)
  }
>
  ✏ Edit Employee
</button>

  <button
    type="button"
    className="employees-delete-btn"
    onClick={() => deleteEmployee(employee)}
  >
    🗑 Delete
  </button>

</div>

                          </td>

                        </tr>

                      );
                    }
                  )}


                  {filteredEmployees.length === 0 && (

                    <tr>

                      <td
                        colSpan="10"
                        className="employees-empty"
                      >
                        No employees found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          )}


          {!loading && (

            <div className="employees-footer">

              Showing{" "}

              <strong>
                {filteredEmployees.length}
              </strong>

              {" "}of{" "}

              <strong>
                {employees.length}
              </strong>

              {" "}employees

            </div>

          )}

        </section>

      </div>


      {/* EDIT BALANCE MODAL */}

      {selectedEmployee && (

        <div
          className="employees-modal-overlay"
          onClick={closeEditBalance}
        >

          <div
            className="employees-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="employees-modal-header">

              <div>

                <span>
                  LEAVE ADMINISTRATION
                </span>

                <h2>Edit Leave Balances</h2>

                <p>
                  Update available paid leave balances
                  for{" "}

                  <strong>
                    {selectedEmployee.name}
                  </strong>
                  .
                </p>

              </div>


              <button
                type="button"
                className="employees-modal-close"
                onClick={closeEditBalance}
                disabled={savingBalances}
              >
                ×
              </button>

            </div>


            <form onSubmit={saveLeaveBalances}>

              <div className="employees-form-grid">

                <label>
                  <span>Casual Leave</span>

                  <input
                    type="number"
                    min="0"
                    name="casual"
                    value={editBalances.casual}
                    onChange={handleBalanceChange}
                    required
                  />
                </label>


                <label>
                  <span>Sick Leave</span>

                  <input
                    type="number"
                    min="0"
                    name="sick"
                    value={editBalances.sick}
                    onChange={handleBalanceChange}
                    required
                  />
                </label>


                <label>
                  <span>Earned Leave</span>

                  <input
                    type="number"
                    min="0"
                    name="earned"
                    value={editBalances.earned}
                    onChange={handleBalanceChange}
                    required
                  />
                </label>


                <label>
                  <span>Marriage Leave</span>

                  <input
                    type="number"
                    min="0"
                    name="marriage"
                    value={editBalances.marriage}
                    onChange={handleBalanceChange}
                    required
                  />
                </label>


                <label>
                  <span>Maternity Leave</span>

                  <input
                    type="number"
                    min="0"
                    name="maternity"
                    value={editBalances.maternity}
                    onChange={handleBalanceChange}
                    required
                  />
                </label>


                <label>
                  <span>Paternity Leave</span>

                  <input
                    type="number"
                    min="0"
                    name="paternity"
                    value={editBalances.paternity}
                    onChange={handleBalanceChange}
                    required
                  />
                </label>


                <label>
                  <span>Bereavement Leave</span>

                  <input
                    type="number"
                    min="0"
                    name="bereavement"
                    value={editBalances.bereavement}
                    onChange={handleBalanceChange}
                    required
                  />
                </label>

              </div>


              <div className="employees-modal-actions">

                <button
                  type="button"
                  className="employees-cancel-btn"
                  onClick={closeEditBalance}
                  disabled={savingBalances}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="employees-save-btn"
                  disabled={savingBalances}
                >
                  {savingBalances
                    ? "Saving..."
                    : "Save Balances"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default Employees;
