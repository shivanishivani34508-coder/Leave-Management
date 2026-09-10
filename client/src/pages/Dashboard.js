import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentYearlyBalance, setCurrentYearlyBalance] = useState(null);
  const [yearlyBalance, setYearlyBalance] = useState(null);

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
     UNAUTHORIZED
  ========================================================= */

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", {
      replace: true,
    });
  }, [navigate]);

  /* =========================================================
     FETCH DASHBOARD DATA
  ========================================================= */

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        handleUnauthorized();
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [profileResponse, leavesResponse] =
        await Promise.all([
          api.get("/users/profile", config),
          api.get("/leaves/my", config),
        ]);

      const latestUser =
        profileResponse.data?.user || profileResponse.data;

      const leaveData = Array.isArray(leavesResponse.data)
        ? leavesResponse.data
        : leavesResponse.data?.leaves || [];

      if (!latestUser) {
        throw new Error("Employee profile not found");
      }

      if (latestUser.role === "admin") {
        navigate("/admin-dashboard", {
          replace: true,
        });

        return;
      }

      setUser(latestUser);
      setLeaves(leaveData);

      localStorage.setItem(
        "user",
        JSON.stringify(latestUser)
      );
    } catch (error) {
      console.error("DASHBOARD ERROR:", error);

      if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      setErrorMessage(
        error.response?.data?.message ||
          "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, navigate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* =========================================================
   FETCH NEXT YEAR LEAVE BALANCE
========================================================= */

const fetchYearlyBalance = useCallback(async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

const currentYear = new Date().getFullYear();
const nextYear = currentYear + 1;

    const currentBalanceResponse = await api.get(
      `/yearly-leave-balances/my?year=${currentYear}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setCurrentYearlyBalance(
      currentBalanceResponse.data?.balance || null
    );

    const response = await api.get(
      `/yearly-leave-balances/my?year=${nextYear}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setYearlyBalance(response.data?.balance || null);

  } catch (error) {
    console.error(
      "YEARLY LEAVE BALANCE ERROR:",
      error
    );

    /*
      Do not show an error on the dashboard if
      next year's balance has not been created yet.
    */
    setYearlyBalance(null);
  }
}, []);

useEffect(() => {
  fetchYearlyBalance();
}, [fetchYearlyBalance]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    return leaves.reduce(
      (result, leave) => {
        result.total += 1;

        const status = String(
          leave.status || ""
        ).toLowerCase();

        if (status === "pending") {
          result.pending += 1;
        }

        if (status === "approved") {
          result.approved += 1;
        }

        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
      }
    );
  }, [leaves]);

  /* =========================================================
   LEAVE BALANCE
========================================================= */
const leaveBalance = useMemo(() => {

  const profileRemaining = user?.leaveBalances || {};
  const remaining = {
    casual: currentYearlyBalance?.casual?.remaining ?? profileRemaining.casual,
    sick: currentYearlyBalance?.sick?.remaining ?? profileRemaining.sick,
    earned: currentYearlyBalance?.earned?.remaining ?? profileRemaining.earned,
    marriage: currentYearlyBalance?.marriage?.remaining ?? profileRemaining.marriage,
    maternity: currentYearlyBalance?.maternity?.remaining ?? profileRemaining.maternity,
    paternity: currentYearlyBalance?.paternity?.remaining ?? profileRemaining.paternity,
    bereavement: currentYearlyBalance?.bereavement?.remaining ?? profileRemaining.bereavement,
  };

  const balances = [

    {
      title: "Casual Leave",
      total: 12,
      remaining: remaining.casual ?? 12,
    },

    {
      title: "Sick Leave",
      total: 12,
      remaining: remaining.sick ?? 12,
    },

    {
      title: "Earned Leave",
      total: 18,
      remaining: remaining.earned ?? 18,
    },

    {
      title: "Marriage Leave",
      total: 5,
      remaining: remaining.marriage ?? 5,
    },

    {
      title: "Bereavement Leave",
      total: 5,
      remaining: remaining.bereavement ?? 5,
    },

  ];

  // Show only for Female employees
  if (user?.gender === "Female") {
    balances.push({
      title: "Maternity Leave",
      total: 182,
      remaining: remaining.maternity ?? 182,
    });
  }

  // Show only for Male employees
  if (user?.gender === "Male") {
    balances.push({
      title: "Paternity Leave",
      total: 15,
      remaining: remaining.paternity ?? 15,
    });
  }

  return balances.map((leave) => ({

    ...leave,

    used: leave.total - leave.remaining,

    percentage:
      (leave.remaining / leave.total) * 100,

    status:
      (leave.remaining / leave.total) >= 0.7
        ? "healthy"
        : (leave.remaining / leave.total) >= 0.3
        ? "warning"
        : "danger",

  }));

}, [user, currentYearlyBalance]);

  /* =========================================================
     RECENT LEAVES
  ========================================================= */

  const recentLeaves = useMemo(() => {
    return [...leaves]
      .sort((firstLeave, secondLeave) => {
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
      })
      .slice(0, 5);
  }, [leaves]);

  /* =========================================================
     DATE FORMATTER
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
     INITIALS
  ========================================================= */

  const getInitials = (name) => {
    if (!name) {
      return "U";
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
     STATUS CLASS
  ========================================================= */

  const getStatusClass = (status) => {
    const normalizedStatus = String(
      status || "Pending"
    ).toLowerCase();

    if (normalizedStatus === "approved") {
      return "approved";
    }

    if (normalizedStatus === "rejected") {
      return "rejected";
    }

    return "pending";
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="employee-dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loading-spinner" />

          <span className="dashboard-loading-text">
            Loading your dashboard...
          </span>
        </div>
      </div>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <div className="employee-dashboard-page">
      <div className="dashboard-container">

        {/* ERROR MESSAGE */}

        {errorMessage && (
          <div className="dashboard-error-message">
            {errorMessage}
          </div>
        )}

        {/* STATISTICS */}

        <section className="dashboard-stats-grid">

          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon total">
              📄
            </div>

            <div className="dashboard-stat-content">
              <span className="dashboard-stat-label">
                Total Requests
              </span>

              <h2 className="dashboard-stat-value">
                {statistics.total}
              </h2>

              <span className="dashboard-stat-helper">
                All leave applications
              </span>
            </div>
          </article>

          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon pending">
              ⏳
            </div>

            <div className="dashboard-stat-content">
              <span className="dashboard-stat-label">
                Pending
              </span>

              <h2 className="dashboard-stat-value">
                {statistics.pending}
              </h2>

              <span className="dashboard-stat-helper">
                Waiting for approval
              </span>
            </div>
          </article>

          <article className="dashboard-stat-card">
            <div className="dashboard-stat-icon approved">
              ✓
            </div>

            <div className="dashboard-stat-content">
              <span className="dashboard-stat-label">
                Approved
              </span>

              <h2 className="dashboard-stat-value">
                {statistics.approved}
              </h2>

              <span className="dashboard-stat-helper">
                Approved leave requests
              </span>
            </div>
          </article>

        </section>

        {/* =========================================================
    MY LEAVE BALANCE
========================================================= */}

<section className="dashboard-leave-balance">

  <div className="dashboard-balance-header">

    <h2 className="dashboard-balance-title">
      My Leave Balance
    </h2>

    <p className="dashboard-balance-subtitle">
      Track your available and used leave for every leave type.
    </p>

  </div>

  <div className="dashboard-balance-grid">

    {leaveBalance.map((leave) => (

      <div
  key={leave.title}
  className={`dashboard-balance-card ${leave.status}`}
>

        <h3 className="dashboard-balance-card-title">
          {leave.title}
        </h3>

        <div className="dashboard-balance-row">

          <span>Total</span>

          <strong>{leave.total} Days</strong>

        </div>

        <div className="dashboard-balance-row">

          <span>Used</span>

          <strong>{leave.used} Days</strong>

        </div>

        <div className="dashboard-balance-row">

          <span>Remaining</span>

          <strong>{leave.remaining} Days</strong>

        </div>

        <div className="dashboard-progress">

  <div
    className={`dashboard-progress-fill ${leave.status}`}
    style={{
      width: `${leave.percentage}%`,
    }}
  />

</div>

<div className="dashboard-balance-status">

  {leave.status === "healthy" && "🟢 Healthy Balance"}

  {leave.status === "warning" && "🟡 Running Low"}

  {leave.status === "danger" && "🔴 Almost Exhausted"}

</div>

      </div>

    ))}

  </div>

</section>

{/* =========================================================
    NEXT YEAR CARRY FORWARD BALANCE
========================================================= */}

{yearlyBalance && (
  <section className="dashboard-yearly-balance">

    <div className="dashboard-yearly-balance-header">

      <div>
        <h2 className="dashboard-yearly-balance-title">
          📅 {yearlyBalance.year} Leave Balance
        </h2>

        <p className="dashboard-yearly-balance-subtitle">
          Your new yearly allocation and carried-forward leaves.
        </p>
      </div>

      <div className="dashboard-year-badge">
        {yearlyBalance.year}
      </div>

    </div>

    <div className="dashboard-yearly-balance-grid">

      {/* CASUAL */}

      {yearlyBalance.casual && (
        <div className="dashboard-yearly-card">

          <h3>Casual Leave</h3>

          <div className="dashboard-yearly-row">
            <span>Annual Allocation</span>
            <strong>
              {yearlyBalance.casual.annualAllocation} Days
            </strong>
          </div>

          <div className="dashboard-yearly-row carry-forward">
            <span>Carry Forward</span>
            <strong>
              +{yearlyBalance.casual.carryForward} Days
            </strong>
          </div>

          <div className="dashboard-yearly-divider" />

          <div className="dashboard-yearly-total">
            <span>Total Available</span>
            <strong>
              {yearlyBalance.casual.totalAvailable} Days
            </strong>
          </div>

          <div className="dashboard-yearly-remaining">
            Remaining:{" "}
            {yearlyBalance.casual.remaining} Days
          </div>

        </div>
      )}

      {/* SICK */}

      {yearlyBalance.sick && (
        <div className="dashboard-yearly-card">

          <h3>Sick Leave</h3>

          <div className="dashboard-yearly-row">
            <span>Annual Allocation</span>
            <strong>
              {yearlyBalance.sick.annualAllocation} Days
            </strong>
          </div>

          <div className="dashboard-yearly-row carry-forward">
            <span>Carry Forward</span>
            <strong>
              +{yearlyBalance.sick.carryForward} Days
            </strong>
          </div>

          <div className="dashboard-yearly-divider" />

          <div className="dashboard-yearly-total">
            <span>Total Available</span>
            <strong>
              {yearlyBalance.sick.totalAvailable} Days
            </strong>
          </div>

          <div className="dashboard-yearly-remaining">
            Remaining:{" "}
            {yearlyBalance.sick.remaining} Days
          </div>

        </div>
      )}

      {/* EARNED */}

      {yearlyBalance.earned && (
        <div className="dashboard-yearly-card">

          <h3>Earned Leave</h3>

          <div className="dashboard-yearly-row">
            <span>Annual Allocation</span>
            <strong>
              {yearlyBalance.earned.annualAllocation} Days
            </strong>
          </div>

          <div className="dashboard-yearly-row carry-forward">
            <span>Carry Forward</span>
            <strong>
              +{yearlyBalance.earned.carryForward} Days
            </strong>
          </div>

          <div className="dashboard-yearly-divider" />

          <div className="dashboard-yearly-total">
            <span>Total Available</span>
            <strong>
              {yearlyBalance.earned.totalAvailable} Days
            </strong>
          </div>

          <div className="dashboard-yearly-remaining">
            Remaining:{" "}
            {yearlyBalance.earned.remaining} Days
          </div>

        </div>
      )}

      {/* MARRIAGE */}

      {yearlyBalance.marriage && (
        <div className="dashboard-yearly-card">

          <h3>Marriage Leave</h3>

          <div className="dashboard-yearly-row">
            <span>Annual Allocation</span>
            <strong>
              {yearlyBalance.marriage.annualAllocation} Days
            </strong>
          </div>

          <div className="dashboard-yearly-row carry-forward">
            <span>Carry Forward</span>
            <strong>
              +{yearlyBalance.marriage.carryForward} Days
            </strong>
          </div>

          <div className="dashboard-yearly-divider" />

          <div className="dashboard-yearly-total">
            <span>Total Available</span>
            <strong>
              {yearlyBalance.marriage.totalAvailable} Days
            </strong>
          </div>

          <div className="dashboard-yearly-remaining">
            Remaining:{" "}
            {yearlyBalance.marriage.remaining} Days
          </div>

        </div>
      )}

      {/* BEREAVEMENT */}

      {yearlyBalance.bereavement && (
        <div className="dashboard-yearly-card">

          <h3>Bereavement Leave</h3>

          <div className="dashboard-yearly-row">
            <span>Annual Allocation</span>
            <strong>
              {yearlyBalance.bereavement.annualAllocation} Days
            </strong>
          </div>

          <div className="dashboard-yearly-row carry-forward">
            <span>Carry Forward</span>
            <strong>
              +{yearlyBalance.bereavement.carryForward} Days
            </strong>
          </div>

          <div className="dashboard-yearly-divider" />

          <div className="dashboard-yearly-total">
            <span>Total Available</span>
            <strong>
              {yearlyBalance.bereavement.totalAvailable} Days
            </strong>
          </div>

          <div className="dashboard-yearly-remaining">
            Remaining:{" "}
            {yearlyBalance.bereavement.remaining} Days
          </div>

        </div>
      )}

      {/* MATERNITY */}

      {yearlyBalance.maternity && user?.gender === "Female" && (
        <div className="dashboard-yearly-card">

          <h3>Maternity Leave</h3>

          <div className="dashboard-yearly-row">
            <span>Annual Allocation</span>
            <strong>
              {yearlyBalance.maternity.annualAllocation} Days
            </strong>
          </div>

          <div className="dashboard-yearly-row carry-forward">
            <span>Carry Forward</span>
            <strong>
              +{yearlyBalance.maternity.carryForward} Days
            </strong>
          </div>

          <div className="dashboard-yearly-divider" />

          <div className="dashboard-yearly-total">
            <span>Total Available</span>
            <strong>
              {yearlyBalance.maternity.totalAvailable} Days
            </strong>
          </div>

          <div className="dashboard-yearly-remaining">
            Remaining:{" "}
            {yearlyBalance.maternity.remaining} Days
          </div>

        </div>
      )}

      {/* PATERNITY */}

      {yearlyBalance.paternity && user?.gender === "Male" && (
        <div className="dashboard-yearly-card">

          <h3>Paternity Leave</h3>

          <div className="dashboard-yearly-row">
            <span>Annual Allocation</span>
            <strong>
              {yearlyBalance.paternity.annualAllocation} Days
            </strong>
          </div>

          <div className="dashboard-yearly-row carry-forward">
            <span>Carry Forward</span>
            <strong>
              +{yearlyBalance.paternity.carryForward} Days
            </strong>
          </div>

          <div className="dashboard-yearly-divider" />

          <div className="dashboard-yearly-total">
            <span>Total Available</span>
            <strong>
              {yearlyBalance.paternity.totalAvailable} Days
            </strong>
          </div>

          <div className="dashboard-yearly-remaining">
            Remaining:{" "}
            {yearlyBalance.paternity.remaining} Days
          </div>

        </div>
      )}

    </div>

    <div className="dashboard-carry-forward-note">
      💡 Carry-forward leaves are added to your new year's
      annual allocation according to company policy.
    </div>

  </section>
)}

        {/* MAIN CONTENT */}

        <section className="dashboard-main-grid">

          {/* RECENT LEAVE REQUESTS */}

          <article className="dashboard-panel">

            <div className="dashboard-panel-header">

              <div className="dashboard-panel-title-wrapper">
                <h2 className="dashboard-panel-title">
                  Recent Leave Requests
                </h2>

                <p className="dashboard-panel-subtitle">
                  Your latest leave applications and status.
                </p>
              </div>

              <button
                type="button"
                className="dashboard-view-all"
                onClick={() =>
                  navigate("/leave-history")
                }
              >
                View All
              </button>

            </div>

            {recentLeaves.length === 0 ? (
              <div className="dashboard-empty-state">

                <div className="dashboard-empty-icon">
                  📋
                </div>

                <h3 className="dashboard-empty-title">
                  No leave requests yet
                </h3>

                <p className="dashboard-empty-description">
                  Apply for leave to see your latest requests
                  and approval status here.
                </p>

              </div>
            ) : (
              <div className="dashboard-table-wrapper">

                <table className="dashboard-table">

                  <thead>
                    <tr>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {recentLeaves.map((leave) => (
                      <tr key={leave._id}>

                        <td>
                          <span className="dashboard-leave-type">
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
                          <span
                            className={`dashboard-status-badge ${getStatusClass(
                              leave.status
                            )}`}
                          >
                            {leave.status || "Pending"}
                          </span>
                        </td>

                      </tr>
                    ))}

                  </tbody>

                </table>

              </div>
            )}

          </article>

          {/* RIGHT SIDE */}

          <aside className="dashboard-side-column">

            {/* QUICK ACTIONS */}

            <article className="dashboard-panel dashboard-quick-actions-panel">

              <div className="dashboard-panel-header">

                <div className="dashboard-panel-title-wrapper">

                  <h2 className="dashboard-panel-title">
                    Quick Actions
                  </h2>

                  <p className="dashboard-panel-subtitle">
                    Access frequently used features.
                  </p>

                </div>

              </div>

              <div className="dashboard-actions-content">

                <button
                  type="button"
                  className="dashboard-action-card"
                  onClick={() =>
                    navigate("/apply-leave")
                  }
                >
                  <span className="dashboard-action-icon">
                    📝
                  </span>

                  <span className="dashboard-action-content">

                    <span className="dashboard-action-title">
                      Apply Leave
                    </span>

                    <span className="dashboard-action-description">
                      Submit a new leave request.
                    </span>

                  </span>

                  <span className="dashboard-action-arrow">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  className="dashboard-action-card"
                  onClick={() =>
                    navigate("/leave-history")
                  }
                >
                  <span className="dashboard-action-icon">
                    📅
                  </span>

                  <span className="dashboard-action-content">

                    <span className="dashboard-action-title">
                      Leave History
                    </span>

                    <span className="dashboard-action-description">
                      View previous leave requests.
                    </span>

                  </span>

                  <span className="dashboard-action-arrow">
                    →
                  </span>
                </button>

                <button
  type="button"
  className="dashboard-action-card"
  onClick={() => navigate("/holidays")}
>
  <span className="dashboard-action-icon">
    🎉
  </span>

  <span className="dashboard-action-content">
    <span className="dashboard-action-title">
      Company Holidays
    </span>

    <span className="dashboard-action-description">
      View all company holidays announced by HR.
    </span>
  </span>

  <span className="dashboard-action-arrow">
    →
  </span>
</button>

              </div>

            </article>

            {/* PROFILE */}

            <article className="dashboard-panel dashboard-profile-panel">

              <div className="dashboard-panel-header">

                <div className="dashboard-panel-title-wrapper">

                  <h2 className="dashboard-panel-title">
                    My Profile
                  </h2>

                  <p className="dashboard-panel-subtitle">
                    Logged-in account information.
                  </p>

                </div>

              </div>

              <div className="dashboard-profile-content">

                <div className="dashboard-profile-top">

                  <div className="dashboard-profile-avatar">
                    {getInitials(user?.name)}
                  </div>

                  <div className="dashboard-profile-info">

                    <span className="dashboard-profile-name">
                      {user?.name || "Employee"}
                    </span>

                    <span className="dashboard-profile-email">
                      {user?.email || "Email not available"}
                    </span>

                  </div>

                </div>

                <div className="dashboard-profile-details">

                  <div className="dashboard-profile-detail">

                    <span className="dashboard-profile-detail-label">
                      Role
                    </span>

                    <span className="dashboard-profile-detail-value">
                      {user?.role || "employee"}
                    </span>

                  </div>

                  <div className="dashboard-profile-detail">

                    <span className="dashboard-profile-detail-label">
                      Total Requests
                    </span>

                    <span className="dashboard-profile-detail-value">
                      {statistics.total}
                    </span>

                  </div>

                  <div className="dashboard-profile-detail">

                    <span className="dashboard-profile-detail-label">
                      Approved
                    </span>

                    <span className="dashboard-profile-detail-value">
                      {statistics.approved}
                    </span>

                  </div>

                </div>

              </div>

            </article>

          </aside>

        </section>

      </div>
    </div>
  );
}

export default Dashboard;
