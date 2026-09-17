import { useEffect, useState } from "react";
import api from "../services/api";
import "./ManagerLeaveRequests.css";

function ManagerLeaveRequests() {
  console.log("ManagerLeaveRequests Loaded");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadLeaves = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const { data } = await api.get("/leaves/manager", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

console.log("========== FRONTEND ==========");
console.log("Manager Leaves:", data);
console.log("Is Array:", Array.isArray(data));
console.log("Length:", data.length);
      setLeaves(data);
    } catch (error) {
      console.error("Error loading manager leaves:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const updateStatus = async (id, status) => {
  try {
    const token = sessionStorage.getItem("token");

    await api.put(
      `/leaves/${id}/manager`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(`Leave ${status} successfully`);

    loadLeaves();

  } catch (error) {
    console.error(error);

    alert("Unable to update leave.");
  }
};

  return (
    <div className="manager-leaves-page">
      <div className="manager-leaves-container">

        <h1>📋 Team Leave Requests</h1>

        <p>
          Review leave requests submitted by your team members.
        </p>

        {loading ? (
          <h3>Loading...</h3>
        ) : leaves.length === 0 ? (
          <h3>No leave requests found.</h3>
        ) : (
          <table className="manager-table">
          <thead>
  <tr>
    <th>Employee</th>
    <th>Department</th>
    <th>Leave Type</th>
    <th>From</th>
    <th>To</th>
    <th>Days</th>
    <th>Approval Status</th>
    <th>Action</th>
  </tr>
</thead><tbody>
  {leaves.map((leave) => (
    <tr key={leave._id}>

      {/* EMPLOYEE */}
      <td>
        {leave.employee?.name || "N/A"}
      </td>

      {/* DEPARTMENT */}
      <td>
        {leave.employee?.department || "N/A"}
      </td>

      {/* LEAVE TYPE */}
      <td>
        {leave.leaveType}
      </td>

      {/* FROM */}
      <td>
        {new Date(
          leave.startDate
        ).toLocaleDateString()}
      </td>

      {/* TO */}
      <td>
        {new Date(
          leave.endDate
        ).toLocaleDateString()}
      </td>

      {/* DAYS */}
      <td>
        {leave.totalDays}
      </td>

      {/* =================================================
          APPROVAL STATUS
      ================================================= */}
      <td>
      <div className="approval-flow">

        {/* MANAGER */}
        {leave.requiredApprovals?.includes("Manager") && (
          <span
            className={
              leave.managerStatus === "Approved"
                ? "stage approved"
                : leave.managerStatus === "Rejected"
                ? "stage rejected"
                : "stage pending"
            }
          >
            Manager: {leave.managerStatus || "Pending"}
          </span>
        )}

        {/* DEPARTMENT HEAD */}
        {leave.requiredApprovals?.includes("DepartmentHead") && (
          <span
            className={
              leave.departmentHeadStatus === "Approved"
                ? "stage approved"
                : leave.departmentHeadStatus === "Rejected"
                ? "stage rejected"
                : "stage pending"
            }
          >
            Department Head: {leave.departmentHeadStatus || "Pending"}
          </span>
        )}

        {/* HR */}
        {leave.requiredApprovals?.includes("HR") && (
          <span
            className={
              leave.hrStatus === "Approved"
                ? "stage approved"
                : leave.hrStatus === "Rejected"
                ? "stage rejected"
                : "stage pending"
            }
          >
            HR: {leave.hrStatus || "Pending"}
          </span>
        )}

      </div>
      </td>

      {/* =================================================
          MANAGER ACTION
      ================================================= */}
      <td>
        {leave.managerStatus === "Pending" ? (
          <div className="manager-actions">

            <button
              className="approve-btn"
              onClick={() =>
                updateStatus(
                  leave._id,
                  "Approved"
                )
              }
            >
              ✅ Approve
            </button>

            <button
              className="reject-btn"
              onClick={() =>
                updateStatus(
                  leave._id,
                  "Rejected"
                )
              }
            >
              ❌ Reject
            </button>

          </div>
        ) : (
          <span className="reviewed-text">
            {leave.managerStatus === "Approved"
              ? "✅ Approved"
              : "❌ Rejected"}
          </span>
        )}
      </td>

    </tr>
  ))}
</tbody>
          </table>
        )}

      </div>
    </div>
  );
}

export default ManagerLeaveRequests;
