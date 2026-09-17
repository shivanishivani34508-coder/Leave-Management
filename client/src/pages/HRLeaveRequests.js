import { useEffect, useState } from "react";
import api from "../services/api";
import "./HRLeaveRequests.css";

function HRLeaveRequests() {
 const [leaves, setLeaves] = useState([]);
 const [loading, setLoading] = useState(true);
 const [processingLeaveId, setProcessingLeaveId] = useState(null);
  /* =========================================================
     FETCH HR LEAVES
  ========================================================= */

  const fetchLeaves = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await api.get("/leaves/hr", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("HR LEAVES:", response.data);

      setLeaves(response.data);
    } catch (error) {
      console.error("HR Leave Error:", error);
      alert("Unable to fetch HR leave requests.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     LOAD DATA
  ========================================================= */

  useEffect(() => {
    fetchLeaves();
  }, []);

  /* =========================================================
     SEPARATE PENDING AND PROCESSED
  ========================================================= */
const pendingLeaves = leaves.filter(
  (leave) =>
    leave.requiredApprovals?.includes("HR") &&
    leave.hrStatus === "Pending"
);
const processedLeaves = leaves.filter(
  (leave) =>
    leave.requiredApprovals?.includes("HR") &&
    leave.hrStatus !== "Pending"
);

  /* =========================================================
     HR APPROVE / REJECT
  ========================================================= */
const updateLeaveStatus = async (
  leaveId,
  status
) => {
  // Prevent duplicate clicks
  if (processingLeaveId === leaveId) {
    return;
  }

  try {
    setProcessingLeaveId(leaveId);

    const token =
      sessionStorage.getItem("token");

    await api.put(
      `/leaves/${leaveId}/hr`,
      { status },
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    alert(
      `Leave ${status.toLowerCase()} successfully.`
    );

    await fetchLeaves();

  } catch (error) {
    console.error(
      "HR approval error:",
      error
    );

    alert(
      error.response?.data?.message ||
        "Unable to update leave."
    );

  } finally {
    setProcessingLeaveId(null);
  }
};

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="hr-loading">
        <h2>Loading HR Leave Requests...</h2>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="hr-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="hr-header">

        <div>
          <h1>🏢 HR Leave Requests</h1>

          <p>
            Review leave requests after Department Head approval.
          </p>
        </div>

        <div className="request-count">
          <strong>{pendingLeaves.length}</strong>
          <span>Pending Requests</span>
        </div>

      </div>

      {/* =====================================================
          NO REQUESTS
      ===================================================== */}

      {pendingLeaves.length === 0 &&
      processedLeaves.length === 0 ? (

        <div className="no-requests">
          <h2>No Leave Requests Found</h2>

          <p>
            There are currently no leave requests
            available for HR.
          </p>
        </div>

      ) : (

        <>

          {/* =================================================
              PENDING HR REQUESTS
          ================================================= */}

          {pendingLeaves.length > 0 && (
            <>
              <div className="section-header">

                <div>
                  <h2>
                    ⏳ Pending HR Requests
                  </h2>

                  <p>
                    These leave requests require HR approval.
                  </p>
                </div>

                <div className="section-badge pending-badge">
                  {pendingLeaves.length} Pending
                </div>

              </div>

              <div className="hr-table-container">

                <table className="hr-table">

                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Total Days</th>
                      <th>HR Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {pendingLeaves.map((leave) => (

                      <tr key={leave._id}>

                        <td>
                          <strong>
                            {leave.employee?.name || "N/A"}
                          </strong>
                        </td>

                        <td>
                          {leave.employee?.department ||
                            leave.department ||
                            "N/A"}
                        </td>

                        <td>
                          {leave.leaveType}
                        </td>

                        <td>
                          {new Date(
                            leave.startDate
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          {new Date(
                            leave.endDate
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          {leave.totalDays}
                        </td>

                        <td>
                          <span className="status-pending">
                            ⏳ Pending
                          </span>
                        </td>

                        <td>

                          <div className="hr-actions">
                          <button
                            className="approve-btn"
                            disabled={
                              processingLeaveId === leave._id
                            }
                            onClick={() =>
                              updateLeaveStatus(
                                leave._id,
                                "Approved"
                              )
                            }
                          >
                            {processingLeaveId === leave._id
                              ? "Processing..."
                              : "✅ Approve"}
                          </button>
                          <button
                            className="reject-btn"
                            disabled={
                              processingLeaveId === leave._id
                            }
                            onClick={() =>
                              updateLeaveStatus(
                                leave._id,
                                "Rejected"
                              )
                            }
                          >
                            {processingLeaveId === leave._id
                              ? "Processing..."
                              : "❌ Reject"}
                          </button>
                          </div>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            </>
          )}

          {/* =================================================
              PROCESSED HR REQUESTS
          ================================================= */}

          {processedLeaves.length > 0 && (
            <>
              <div className="section-header processed-section">

                <div>
                  <h2>
                    📋 Processed HR Requests
                  </h2>

                  <p>
                    Leave requests already reviewed by HR.
                  </p>
                </div>

                <div className="section-badge processed-badge">
                  {processedLeaves.length} Processed
                </div>

              </div>

              <div className="hr-table-container">

                <table className="hr-table">

                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Total Days</th>
                      <th>HR Status</th>
                      <th>Result</th>
                    </tr>
                  </thead>

                  <tbody>

                    {processedLeaves.map((leave) => (

                      <tr key={leave._id}>

                        <td>
                          <strong>
                            {leave.employee?.name || "N/A"}
                          </strong>
                        </td>

                        <td>
                          {leave.employee?.department ||
                            leave.department ||
                            "N/A"}
                        </td>

                        <td>
                          {leave.leaveType}
                        </td>

                        <td>
                          {new Date(
                            leave.startDate
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          {new Date(
                            leave.endDate
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          {leave.totalDays}
                        </td>

                        <td>

                          {leave.hrStatus === "Approved" ? (

                            <span className="status-approved">
                              ✅ Approved
                            </span>

                          ) : (

                            <span className="status-rejected">
                              ❌ Rejected
                            </span>

                          )}

                        </td>

                        <td>

                          {leave.hrStatus === "Approved" ? (

                            <strong className="reviewed-text">
                              ✅ Approved
                            </strong>

                          ) : (

                            <strong className="reviewed-text">
                              ❌ Rejected
                            </strong>

                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            </>
          )}

        </>

      )}

    </div>
  );
}

export default HRLeaveRequests;
