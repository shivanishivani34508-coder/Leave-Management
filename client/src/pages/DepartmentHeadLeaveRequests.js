import { useEffect, useState } from "react";
import api from "../services/api";
import "./DepartmentHeadLeaveRequests.css";

function DepartmentHeadLeaveRequests() {
  console.log("******** NEW DEPARTMENT HEAD FILE LOADED ********");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =====================================================
     LOAD DEPARTMENT HEAD LEAVES
  ===================================================== */

  const fetchLeaves = async () => {
    try {
      const token = sessionStorage.getItem("token");

      const response = await api.get(
        "/leaves/department-head",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "Department Head Leaves:",
        response.data
      );
      console.log("===== DH LEAVE DEBUG =====");
      console.log("TOTAL LEAVES:", response.data.length);
      console.log(
        "MANAGER LEAVES:",
        response.data.filter(
          (leave) => leave.employee?.role === "manager"
        )
      );      
      console.log("ALL LEAVES:", response.data);
            setLeaves(response.data);
          } catch (error) {
            console.error(
              "Error loading department head leaves:",
              error
            );
          } finally {
            setLoading(false);
          }
        };

        useEffect(() => {
          fetchLeaves();
        }, []);

  /* =====================================================
     SEPARATE PENDING AND PROCESSED REQUESTS
  ===================================================== */
  const pendingLeaves = leaves.filter(
  (leave) =>
    (leave.requiredApprovals?.includes("DepartmentHead") || leave.employee?.role === "manager" || leave.totalDays > 2) &&
    leave.departmentHeadStatus === "Pending" &&
    (
      leave.employee?.role === "manager" ||
      leave.managerStatus === "Approved" ||
      (
        leave.employee?._id &&
        leave.managerStatus === "Pending" &&
        leave.departmentHeadStatus === "Pending"
      )
    )
);

const processedLeaves = leaves.filter(
  (leave) =>
    (leave.requiredApprovals?.includes("DepartmentHead") || leave.departmentHeadStatus === "Approved" || leave.departmentHeadStatus === "Rejected") &&
    leave.departmentHeadStatus !== "Pending" &&
    (
      leave.employee?.role === "manager" ||
      leave.managerStatus === "Approved" ||
      leave.departmentHeadStatus === "Approved" ||
      leave.departmentHeadStatus === "Rejected"
    )
);

  /* =====================================================
     DEPARTMENT HEAD APPROVAL
  ===================================================== */

  const updateStatus = async (id, status) => {
    try {
      const token = sessionStorage.getItem("token");

      await api.put(
        `/leaves/${id}/department-head`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        `Leave ${status.toLowerCase()} successfully`
      );

      fetchLeaves();
    } catch (error) {
      console.error(
        "Department Head approval error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Unable to update leave."
      );
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="department-head-loading">
        <h2>Loading Department Head Leave Requests...</h2>
      </div>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="department-head-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="department-head-header">

        <div>
          <h1>
            🏢 Department Head Leave Requests
          </h1>

          <p>
            Review leave requests after Manager approval.
          </p>
        </div>

        <div className="request-count">
          <strong>{pendingLeaves.length}</strong>
          <span>Pending Requests</span>
        </div>

      </div>

      {/* =================================================
          NO REQUESTS
      ================================================= */}

      {pendingLeaves.length === 0 &&
      processedLeaves.length === 0 ? (

        <div className="no-requests">
          <h2>No Leave Requests Found</h2>

          <p>
            There are currently no leave requests
            for your department.
          </p>
        </div>

      ) : (

        <>

          {/* =================================================
              PENDING REQUESTS
          ================================================= */}

          {pendingLeaves.length > 0 && (
            <>
              <div className="section-header">
                <div>
                  <h2>
                    ⏳ Pending Department Head Requests
                  </h2>

                  <p>
                    These leave requests require your
                    approval.
                  </p>
                </div>

                <div className="section-badge pending-badge">
                  {pendingLeaves.length} Pending
                </div>
              </div>

              <div className="department-table-container">

                <table className="department-head-table">

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
                  </thead>

                  <tbody>

                    {pendingLeaves.map((leave) => (

                      <tr key={leave._id}>

                        {/* EMPLOYEE */}

                        <td>
                          <strong>
                            {leave.employee?.name ||
                              "N/A"}
                          </strong>
                        </td>

                        {/* DEPARTMENT */}

                        <td>
                          {leave.employee?.department ||
                            "N/A"}
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

                        {/* APPROVAL FLOW */}

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
                              Department Head:{" "}
                              {leave.departmentHeadStatus || "Pending"}
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

                        {/* ACTION */}

                        <td>

                          {leave.departmentHeadStatus ===
                          "Pending" ? (

                            <div className="department-actions">

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

                              {leave.departmentHeadStatus ===
                              "Approved"
                                ? "✅ Approved"
                                : "❌ Rejected"}

                            </span>

                          )}

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>
            </>
          )}

          {/* =================================================
              PROCESSED REQUESTS
          ================================================= */}

          {processedLeaves.length > 0 && (
            <>

              <div className="section-header processed-section">

                <div>
                  <h2>
                    📋 Processed Department Head Requests
                  </h2>

                  <p>
                    Leave requests already reviewed by
                    the Department Head.
                  </p>
                </div>

                <div className="section-badge processed-badge">
                  {processedLeaves.length} Processed
                </div>

              </div>

              <div className="department-table-container">

                <table className="department-head-table">

                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Days</th>
                      <th>Approval Status</th>
                      <th>Result</th>
                    </tr>
                  </thead>

                  <tbody>

                    {processedLeaves.map((leave) => (

                      <tr key={leave._id}>

                        {/* EMPLOYEE */}

                        <td>
                          <strong>
                            {leave.employee?.name ||
                              "N/A"}
                          </strong>
                        </td>

                        {/* DEPARTMENT */}

                        <td>
                          {leave.employee?.department ||
                            "N/A"}
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

                        {/* APPROVAL STATUS */}

                        <td>

                          <div className="approval-flow">

                            <span
                              className={
                                leave.managerStatus ===
                                "Approved"
                                  ? "stage approved"
                                  : leave.managerStatus ===
                                    "Rejected"
                                  ? "stage rejected"
                                  : "stage pending"
                              }
                            >
                              Manager:{" "}
                              {leave.managerStatus ||
                                "Pending"}
                            </span>

                            <span
                              className={
                                leave.departmentHeadStatus ===
                                "Approved"
                                  ? "stage approved"
                                  : leave.departmentHeadStatus ===
                                    "Rejected"
                                  ? "stage rejected"
                                  : "stage pending"
                              }
                            >
                              Department Head:{" "}
                              {leave.departmentHeadStatus ||
                                "Pending"}
                            </span>


                          </div>

                        </td>

                        {/* RESULT */}

                        <td>

                          {leave.departmentHeadStatus ===
                          "Approved" ? (

                            <span className="reviewed-text approved-result">
                              ✅ Approved
                            </span>

                          ) : (

                            <span className="reviewed-text rejected-result">
                              ❌ Rejected
                            </span>

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

export default DepartmentHeadLeaveRequests;
