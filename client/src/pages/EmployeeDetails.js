import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";

import "./EmployeeDetails.css";

function EmployeeDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  /* =========================================================
      STATES
  ========================================================= */

  const [employee, setEmployee] = useState(null);

  const [statistics, setStatistics] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const [leaveUsage, setLeaveUsage] = useState({
    approvedTotalDays: 0,
    approvedPaidDays: 0,
    approvedUnpaidDays: 0,
  });

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

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
      FETCH EMPLOYEE DETAILS
  ========================================================= */

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/users/${id}`,
        getAuthConfig()
      );

      setEmployee(response.data.user);

      setStatistics(
        response.data.statistics || {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        }
      );

      setLeaveUsage(
        response.data.leaveUsage || {
          approvedTotalDays: 0,
          approvedPaidDays: 0,
          approvedUnpaidDays: 0,
        }
      );

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load employee details."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  /* =========================================================
      HELPERS
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const balances =
    employee?.leaveBalance ||
    employee?.leaveBalances ||
    {};

  const employeeInitials = useMemo(() => {
    if (!employee?.name) return "E";

    const words = employee.name.trim().split(" ");

    if (words.length === 1)
      return words[0][0].toUpperCase();

    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();
  }, [employee]);

  /* =========================================================
      LEAVE BALANCE CARDS
  ========================================================= */
  const employeeGender = String(employee?.gender || "").toLowerCase();

  const leaveCards = [
    {
      title: "Casual Leave",
      value: balances.casual ?? 0,
      icon: "🏖️",
      color: "#3b82f6",
    },
    {
      title: "Sick Leave",
      value: balances.sick ?? 0,
      icon: "🤒",
      color: "#ef4444",
    },
    {
      title: "Earned Leave",
      value: balances.earned ?? 0,
      icon: "💼",
      color: "#22c55e",
    },
    {
      title: "Marriage Leave",
      value: balances.marriage ?? 0,
      icon: "💍",
      color: "#ec4899",
    },
   ...(employeeGender === "female"
  ? [
      {
        title: "Maternity",
        value: balances.maternity ?? 0,
        icon: "🤱",
        color: "#8b5cf6",
      },
    ]
  : []),

...(employeeGender === "male"
  ? [
      {
        title: "Paternity",
        value: balances.paternity ?? 0,
        icon: "👨‍👦",
        color: "#f97316",
      },
    ]
  : []),
    {
      title: "Bereavement",
      value: balances.bereavement ?? 0,
      icon: "🕊️",
      color: "#64748b",
    },
    {
      title: "Leave Without Pay",
      value: balances.unpaid ?? 0,
      icon: "📄",
      color: "#0f766e",
    },
  ];

  /* =========================================================
      LOADING SCREEN
  ========================================================= */

  if (loading) {
    return (
      <div className="employee-details-loading">
        <div className="employee-loader"></div>

        <h2>Loading Employee Details...</h2>
      </div>
    );
  }

  /* =========================================================
      ERROR SCREEN
  ========================================================= */

  if (error) {
    return (
      <div className="employee-details-error">
        <h2>Unable to Load Employee</h2>

        <p>{error}</p>

        <button
          onClick={() => navigate("/employees")}
        >
          Back
        </button>
      </div>
    );
  }

  /* =========================================================
      NOT FOUND
  ========================================================= */

  if (!employee) {
    return (
      <div className="employee-details-error">
        <h2>Employee Not Found</h2>

        <button
          onClick={() => navigate("/employees")}
        >
          Back
        </button>
      </div>
    );
  }

  /* =========================================================
      MAIN PAGE JSX STARTS IN PART 1B
  ========================================================= */
   return (
    <div className="employee-details-page">

      {/* Background Shapes */}

      <div className="employee-bg-circle employee-bg-circle1"></div>
      <div className="employee-bg-circle employee-bg-circle2"></div>

      <div className="employee-details-container">

        {/* =========================================
            HEADER
        ========================================== */}

        <div className="employee-profile-card">

          <button
            className="employee-back-btn"
            onClick={() => navigate("/employees")}
          >
            ← Back to Employees
          </button>

          <div className="employee-profile-content">

            {/* Avatar */}

            <div className="employee-avatar">

              {employeeInitials}

            </div>

            {/* Employee Details */}

            <div className="employee-profile-info">

              <h1>{employee.name}</h1>

              <p>{employee.email}</p>

              <div className="employee-role-badge">

                {employee.role}

              </div>

            </div>

            {/* Joined Date */}

            <div className="employee-joined">

              <span>Joined On</span>

              <strong>

                {formatDate(employee.createdAt)}

              </strong>

            </div>

          </div>

        </div>

        
        {/* =========================================
            LEAVE BALANCES
        ========================================== */}

        <section className="employee-section">

          <h2>Available Leave Balance</h2>

          <div className="employee-balance-grid">

            {leaveCards.map((leave) => (

              <div
                key={leave.title}
                className="employee-balance-card"
              >

                <div
                  className="employee-balance-icon"
                  style={{
                    background: leave.color,
                  }}
                >

                  {leave.icon}

                </div>

                <h3>{leave.title}</h3>

                <h1>{leave.value}</h1>

                <span>Days Remaining</span>

              </div>

            ))}

          </div>

        </section>
                {/* =========================================
            APPROVED LEAVE USAGE
        ========================================== */}

        <section className="employee-section">

          <h2>Approved Leave Usage</h2>

          <div className="employee-usage-grid">

            <div className="employee-usage-card">

              <h3>Total Approved Days</h3>

              <h1>{leaveUsage.approvedTotalDays}</h1>

              <div className="usage-progress">

                <div
                  className="usage-fill usage-blue"
                  style={{
                    width: `${Math.min(
                      leaveUsage.approvedTotalDays,
                      100
                    )}%`,
                  }}
                ></div>

              </div>

            </div>

            <div className="employee-usage-card">

              <h3>Paid Leave Used</h3>

              <h1>{leaveUsage.approvedPaidDays}</h1>

              <div className="usage-progress">

                <div
                  className="usage-fill usage-green"
                  style={{
                    width: `${Math.min(
                      leaveUsage.approvedPaidDays,
                      100
                    )}%`,
                  }}
                ></div>

              </div>

            </div>

            <div className="employee-usage-card">

              <h3>Unpaid Leave Used</h3>

              <h1>{leaveUsage.approvedUnpaidDays}</h1>

              <div className="usage-progress">

                <div
                  className="usage-fill usage-red"
                  style={{
                    width: `${Math.min(
                      leaveUsage.approvedUnpaidDays,
                      100
                    )}%`,
                  }}
                ></div>

              </div>

            </div>

          </div>

        </section>

        {/* =========================================
            PERFORMANCE SUMMARY
        ========================================== */}

        <section className="employee-section">

          <h2>Performance Summary</h2>

          <div className="employee-summary-grid">

            <div className="summary-card">

              <span>Total Leave Requests</span>

              <h2>{statistics.total}</h2>

            </div>

            <div className="summary-card">

              <span>Approval Rate</span>

              <h2>

                {statistics.total === 0
                  ? 0
                  : Math.round(
                      (statistics.approved /
                        statistics.total) *
                        100
                    )}

                %

              </h2>

            </div>

            <div className="summary-card">

              <span>Pending Requests</span>

              <h2>{statistics.pending}</h2>

            </div>

            <div className="summary-card">

              <span>Rejected Requests</span>

              <h2>{statistics.rejected}</h2>

            </div>

          </div>

        </section>

       
              </div>

    </div>

  );

}

export default EmployeeDetails;
