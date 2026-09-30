import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./ManagerDetails.css";

function ManagerDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [manager, setManager] = useState(null);

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

  const [leaves, setLeaves] = useState([]);

  const fetchManager = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(`/users/manager/${id}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });

      const data = response.data;

      if (!data.user) {
        throw new Error("Manager not found.");
      }

      if (data.user.role !== "manager") {
        alert("The selected account is not a manager.");
        navigate("/admin/managers");
        return;
      }

      setManager(data.user);

      setStatistics(
        data.statistics || {
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        }
      );

      setLeaveUsage(
        data.leaveUsage || {
          approvedTotalDays: 0,
          approvedPaidDays: 0,
          approvedUnpaidDays: 0,
        }
      );

      setLeaves(data.leaves || []);
    } catch (error) {
      console.error("Manager Details Error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to load manager details."
      );

      navigate("/admin/managers");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchManager();
  }, [fetchManager]);

  if (loading) {
    return (
      <div className="manager-details-loading">
        Loading Manager Details...
      </div>
    );
  }

  if (!manager) {
    return null;
  }

  return (
    <div className="manager-details-page">

      {/* HEADER */}
      <div className="manager-details-header">
        <div>
          <h1>Manager Details</h1>

          <p>
            View manager profile, leave balance and leave history.
          </p>
        </div>

        <button
          type="button"
          className="manager-details-back-btn"
          onClick={() => navigate("/admin/managers")}
        >
          ← Back to Managers
        </button>
      </div>

      {/* PROFILE */}
      <div className="manager-details-profile-card">

        <div className="manager-details-avatar">
          {manager.name
            ? manager.name.charAt(0).toUpperCase()
            : "M"}
        </div>

        <div className="manager-details-profile-info">

          <h2>
            {manager.name || "-"}
          </h2>

          <p>
            {manager.email || "-"}
          </p>

          <div className="manager-details-tags">

            <span>
              Manager
            </span>

            <span>
              {manager.department ||
                "Department not assigned"}
            </span>

          </div>

        </div>
      </div>

      {/* BASIC INFORMATION */}
      <div className="manager-details-section">

        <h2>Manager Information</h2>

        <div className="manager-details-grid">

          <div className="manager-details-item">
            <span>Name</span>

            <strong>
              {manager.name || "-"}
            </strong>
          </div>

          <div className="manager-details-item">
            <span>Email</span>

            <strong>
              {manager.email || "-"}
            </strong>
          </div>

          <div className="manager-details-item">
            <span>Gender</span>

            <strong>
              {manager.gender || "-"}
            </strong>
          </div>

          <div className="manager-details-item">
            <span>Role</span>

            <strong>
              Manager
            </strong>
          </div>

          <div className="manager-details-item">
            <span>Department</span>

            <strong>
              {manager.department || "-"}
            </strong>
          </div>

        </div>
      </div>

      {/* LEAVE BALANCE */}
      <div className="manager-details-section">

        <h2>Leave Balance</h2>

        <div className="manager-balance-grid">

          <div className="manager-balance-card">
            <span>Casual</span>

            <strong>
              {manager.leaveBalances?.casual ?? 0}
            </strong>

            <small>
              Days Available
            </small>
          </div>

          <div className="manager-balance-card">
            <span>Sick</span>

            <strong>
              {manager.leaveBalances?.sick ?? 0}
            </strong>

            <small>
              Days Available
            </small>
          </div>

          <div className="manager-balance-card">
            <span>Earned</span>

            <strong>
              {manager.leaveBalances?.earned ?? 0}
            </strong>

            <small>
              Days Available
            </small>
          </div>

          <div className="manager-balance-card">
            <span>Marriage</span>

            <strong>
              {manager.leaveBalances?.marriage ?? 0}
            </strong>

            <small>
              Days Available
            </small>
          </div>

        </div>
      </div>

      {/* LEAVE STATISTICS */}
      <div className="manager-details-section">

        <h2>Leave Statistics</h2>

        <div className="manager-statistics-grid">

          <div className="manager-stat-card">
            <span>Total Requests</span>

            <strong>
              {statistics.total}
            </strong>
          </div>

          <div className="manager-stat-card">
            <span>Approved</span>

            <strong>
              {statistics.approved}
            </strong>
          </div>

          <div className="manager-stat-card">
            <span>Pending</span>

            <strong>
              {statistics.pending}
            </strong>
          </div>

          <div className="manager-stat-card">
            <span>Rejected</span>

            <strong>
              {statistics.rejected}
            </strong>
          </div>

        </div>
      </div>

      {/* LEAVE USAGE */}
      <div className="manager-details-section">

        <h2>Approved Leave Usage</h2>

        <div className="manager-usage-grid">

          <div>
            <span>Total Days</span>

            <strong>
              {leaveUsage.approvedTotalDays}
            </strong>
          </div>

          <div>
            <span>Paid Days</span>

            <strong>
              {leaveUsage.approvedPaidDays}
            </strong>
          </div>

          <div>
            <span>Unpaid Days</span>

            <strong>
              {leaveUsage.approvedUnpaidDays}
            </strong>
          </div>

        </div>
      </div>

      {/* LEAVE HISTORY */}
      <div className="manager-details-section">

        <h2>Leave History</h2>

        {leaves.length === 0 ? (

          <div className="manager-no-leaves">
            No leave requests found.
          </div>

        ) : (

          <div className="manager-leave-table-wrapper">

            <table className="manager-leave-table">

              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Total Days</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {leaves.map((leave) => (

                  <tr key={leave._id}>

                    <td>
                      {leave.leaveType || "-"}
                    </td>

                    <td>
                      {leave.startDate
                        ? new Date(
                            leave.startDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      {leave.endDate
                        ? new Date(
                            leave.endDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      {leave.totalDays ?? 0}
                    </td>

                    <td>

                      <span
                        className={`manager-leave-status ${String(
                          leave.status || ""
                        ).toLowerCase()}`}
                      >
                        {leave.status || "-"}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}

export default ManagerDetails;