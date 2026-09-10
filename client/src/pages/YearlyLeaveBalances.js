import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./YearlyLeaveBalances.css";

/* =========================================================
   YEARLY LEAVE BALANCES
   ADMIN / HR PAGE
========================================================= */

function YearlyLeaveBalances() {
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  /* =========================================================
     FETCH YEARLY BALANCES
  ========================================================= */

  const fetchYearlyBalances = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("Authentication token not found.");
        setLoading(false);
        return;
      }

      const response = await api.get(
        `/yearly-leave-balances/all?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBalances(response.data?.balances || []);
    } catch (error) {
      console.error(
        "YEARLY LEAVE BALANCES ERROR:",
        error
      );

      setBalances([]);

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to fetch yearly leave balances."
      );
    } finally {
      setLoading(false);
    }
  }, [year]);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    fetchYearlyBalances();
  }, [fetchYearlyBalances]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredBalances = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return balances;
    }

    return balances.filter((item) => {
      const employee = item.employee || {};

      return (
        employee.name?.toLowerCase().includes(search) ||
        employee.email?.toLowerCase().includes(search) ||
        employee.department?.toLowerCase().includes(search)
      );
    });
  }, [balances, searchTerm]);

  /* =========================================================
     TOTAL CARRY FORWARD
  ========================================================= */

  const getTotalCarryForward = (balance) => {
    return (
      Number(balance?.casual?.carryForward || 0) +
      Number(balance?.sick?.carryForward || 0) +
      Number(balance?.earned?.carryForward || 0) +
      Number(balance?.marriage?.carryForward || 0) +
      Number(balance?.maternity?.carryForward || 0) +
      Number(balance?.paternity?.carryForward || 0) +
      Number(balance?.bereavement?.carryForward || 0)
    );
  };
/* =========================================================
   REGULAR LEAVE AVAILABLE

   Only Casual + Sick + Earned are regular yearly leaves.
   Special leaves such as Marriage, Maternity, Paternity,
   and Bereavement are not added here.
========================================================= */

const getRegularLeaveAvailable = (balance) => {
  return (
    Number(balance?.casual?.totalAvailable || 0) +
    Number(balance?.sick?.totalAvailable || 0) +
    Number(balance?.earned?.totalAvailable || 0)
  );
};

  /* =========================================================
     SUMMARY
  ========================================================= */
const summary = useMemo(() => {
  let totalCarryForward = 0;
  let regularLeaveAvailable = 0;

  balances.forEach((balance) => {
    totalCarryForward +=
      getTotalCarryForward(balance);

    regularLeaveAvailable +=
      getRegularLeaveAvailable(balance);
  });

  return {
    employees: balances.length,
    totalCarryForward,
    regularLeaveAvailable,
  };
}, [balances]);

  /* =========================================================
     FORMAT EMPLOYEE INITIAL
  ========================================================= */

  const getInitial = (name) => {
    if (!name) {
      return "?";
    }

    return name.charAt(0).toUpperCase();
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="yearly-leave-page">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="yearly-leave-header">

        <div className="yearly-leave-title-section">

          <div className="yearly-leave-icon">
            📅
          </div>

          <div>
            <h1>Yearly Leave Balances</h1>

            <p>
              View employee yearly allocations and
              carried-forward leaves.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="yearly-refresh-button"
          onClick={fetchYearlyBalances}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>

      </div>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}

      <div className="yearly-filter-card">

        <div className="yearly-filter-group">

          <label htmlFor="year">
            Leave Year
          </label>

          <select
            id="year"
            value={year}
            onChange={(event) =>
              setYear(Number(event.target.value))
            }
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
            <option value={2029}>2029</option>
            <option value={2030}>2030</option>
          </select>

        </div>

        <div className="yearly-search-group">

          <label htmlFor="employee-search">
            Search Employee
          </label>

          <div className="yearly-search-box">

            <span>⌕</span>

            <input
              id="employee-search"
              type="text"
              placeholder="Search by name, email or department..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

          </div>

        </div>

      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="yearly-summary-grid">

        <div className="yearly-summary-card">

          <div className="yearly-summary-icon">
            👥
          </div>

          <div>
            <span>Total Employees</span>
            <strong>
              {summary.employees}
            </strong>
          </div>

        </div>

        <div className="yearly-summary-card">

          <div className="yearly-summary-icon carry">
            ↗
          </div>

          <div>
            <span>Total Carry Forward</span>
            <strong>
              {summary.totalCarryForward} Days
            </strong>
          </div>

        </div>

       <div className="yearly-summary-card">

        <div className="yearly-summary-icon available">
          ✓
        </div>

        <div>
          <span>Regular Leave Available</span>
          <strong>
            {summary.regularLeaveAvailable} Days
          </strong>
        </div>

      </div>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMessage && (
        <div className="yearly-error">
          <strong>Unable to load data</strong>
          <span>{errorMessage}</span>

          <button
            type="button"
            onClick={fetchYearlyBalances}
          >
            Try Again
          </button>
        </div>
      )}

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="yearly-loading">

          <div className="yearly-spinner" />

          <p>
            Loading {year} leave balances...
          </p>

        </div>
      )}

      {/* =====================================================
          DATA TABLE
      ===================================================== */}

      {!loading && !errorMessage && (
        <div className="yearly-table-card">

          <div className="yearly-table-header">

            <div>
              <h2>
                {year} Employee Leave Balances
              </h2>

              <p>
                {filteredBalances.length} employee
                {filteredBalances.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </p>
            </div>

            <div className="yearly-policy-badge">
              Carry Forward Enabled
            </div>

          </div>

          {filteredBalances.length === 0 ? (
            <div className="yearly-empty">

              <div className="yearly-empty-icon">
                📭
              </div>

              <h3>
                No yearly balances found
              </h3>

              <p>
                No employee leave balances are available
                for {year}.
              </p>

            </div>
          ) : (
            <div className="yearly-table-wrapper">

              <table className="yearly-balance-table">

                <thead>
                  <tr>

                    <th>Employee</th>

                    <th>Department</th>

                    <th>Casual</th>

                    <th>Sick</th>

                    <th>Earned</th>

                    <th>Total Carry Forward</th>

                    <th>Regular Leave</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredBalances.map((item) => {

                    const employee =
                      item.employee || {};

                    const totalCarryForward =
                      getTotalCarryForward(item);

                    const regularLeaveAvailable =
                      getRegularLeaveAvailable(item);

                    return (
                      <tr
                        key={
                          item._id ||
                          employee._id ||
                          employee.email
                        }
                      >

                        {/* EMPLOYEE */}

                        <td>

                          <div className="employee-info">

                            <div className="employee-avatar">
                              {getInitial(
                                employee.name
                              )}
                            </div>

                            <div>

                              <strong>
                                {employee.name ||
                                  "Unknown Employee"}
                              </strong>

                              <small>
                                {employee.email ||
                                  "No email"}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* DEPARTMENT */}

                        <td>
                          <span className="department-badge">
                            {employee.department ||
                              "Not Assigned"}
                          </span>
                        </td>

                        {/* CASUAL */}

                        <td>
                          <div className="leave-cell">

                            <strong>
                              {Number(
                                item.casual
                                  ?.totalAvailable || 0
                              )}{" "}
                              Days
                            </strong>

                            <small>
                              +{Number(
                                item.casual
                                  ?.carryForward || 0
                              )} carry
                            </small>

                          </div>
                        </td>

                        {/* SICK */}

                        <td>
                          <div className="leave-cell">

                            <strong>
                              {Number(
                                item.sick
                                  ?.totalAvailable || 0
                              )}{" "}
                              Days
                            </strong>

                            <small>
                              +{Number(
                                item.sick
                                  ?.carryForward || 0
                              )} carry
                            </small>

                          </div>
                        </td>

                        {/* EARNED */}

                        <td>
                          <div className="leave-cell">

                            <strong>
                              {Number(
                                item.earned
                                  ?.totalAvailable || 0
                              )}{" "}
                              Days
                            </strong>

                            <small>
                              +{Number(
                                item.earned
                                  ?.carryForward || 0
                              )} carry
                            </small>

                          </div>
                        </td>

                        {/* TOTAL CARRY */}

                        <td>

                          <span
                            className={
                              totalCarryForward > 0
                                ? "carry-value active"
                                : "carry-value"
                            }
                          >
                            +{totalCarryForward} Days
                          </span>

                        </td>

                        {/* TOTAL AVAILABLE */}

                        <td>

                          <strong className="total-available-value">
                              {regularLeaveAvailable} Days
                          </strong>
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>
      )}

      {/* =====================================================
          POLICY INFORMATION
      ===================================================== */}

      {!loading && (
        <div className="yearly-policy-card">

          <div className="yearly-policy-icon">
            💡
          </div>

          <div>

            <h3>
              Carry Forward Policy
            </h3>

            <p>
              Eligible unused leave from the previous
              year is carried forward and added to the
              employee's new yearly allocation according
              to company policy.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}

export default YearlyLeaveBalances;