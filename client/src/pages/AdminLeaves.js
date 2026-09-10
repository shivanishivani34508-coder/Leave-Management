import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminLeaves() {
  const navigate = useNavigate();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // ==========================
  // Get All Leave Requests
  // ==========================
  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      // JWT token is automatically added by api.js
      const response = await api.get("/leaves");

      setLeaves(response.data);
    } catch (err) {
      console.log("GET ALL LEAVES ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load leave requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // ==========================
  // Approve / Reject Leave
  // ==========================
  const updateStatus = async (leaveId, status) => {
    const confirmUpdate = window.confirm(
      `Are you sure you want to ${status.toLowerCase()} this leave request?`
    );

    if (!confirmUpdate) {
      return;
    }

    try {
      setError("");
      setMessage("");

      // JWT token is automatically added by api.js
      const response = await api.put(
        `/leaves/${leaveId}/status`,
        {
          status,
        }
      );

      setMessage(response.data.message);

      // Reload leaves to show updated status
      await fetchLeaves();
    } catch (err) {
      console.log("UPDATE STATUS ERROR:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update leave status"
      );
    }
  };

  // ==========================
  // Search + Filter Logic
  // ==========================
  const filteredLeaves = leaves.filter((leave) => {
    const employeeName =
      leave.employee?.name?.toLowerCase() || "";

    const employeeEmail =
      leave.employee?.email?.toLowerCase() || "";

    const searchText = search.toLowerCase().trim();

    const matchesSearch =
      employeeName.includes(searchText) ||
      employeeEmail.includes(searchText);

    const matchesStatus =
      statusFilter === "All" ||
      leave.status === statusFilter;

    const matchesType =
      typeFilter === "All" ||
      leave.leaveType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // ==========================
  // Clear Filters
  // ==========================
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setTypeFilter("All");
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ textAlign: "center" }}>
        All Leave Requests
      </h1>

      <div
        style={{
          textAlign: "center",
          marginBottom: "25px",
        }}
      >
        <button
          onClick={() => navigate("/admin-dashboard")}
        >
          Back to Admin Dashboard
        </button>
      </div>

      {message && (
        <p
          style={{
            color: "green",
            textAlign: "center",
          }}
        >
          {message}
        </p>
      )}

      {error && (
        <p
          style={{
            color: "red",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}

      {/* Search and Filter Section */}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "15px",
          flexWrap: "wrap",
          marginBottom: "25px",
        }}
      >
        <input
          type="text"
          placeholder="Search employee name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px",
            width: "250px",
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          style={{ padding: "8px" }}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value)
          }
          style={{ padding: "8px" }}
        >
          <option value="All">All Leave Types</option>
          <option value="Casual">Casual</option>
          <option value="Sick">Sick</option>
          <option value="Earned">Earned</option>
        </select>

        <button onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {!loading && (
        <p style={{ textAlign: "center" }}>
          Showing <b>{filteredLeaves.length}</b> of{" "}
          <b>{leaves.length}</b> leave requests
        </p>
      )}

      {loading && (
        <p style={{ textAlign: "center" }}>
          Loading leave requests...
        </p>
      )}

      {!loading && !error && leaves.length === 0 && (
        <p style={{ textAlign: "center" }}>
          No leave requests found.
        </p>
      )}

      {!loading &&
        !error &&
        leaves.length > 0 &&
        filteredLeaves.length === 0 && (
          <p style={{ textAlign: "center" }}>
            No leave requests match your search or filters.
          </p>
        )}

      {!loading &&
        !error &&
        filteredLeaves.length > 0 && (
          <table
            border="1"
            cellPadding="10"
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Number of Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredLeaves.map((leave) => (
                <tr key={leave._id}>
                  <td>
                    {leave.employee?.name ||
                      "Deleted Employee"}
                  </td>

                  <td>
                    {leave.employee?.email || "-"}
                  </td>

                  <td>{leave.leaveType}</td>

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
                    {leave.numberOfDays || "-"}
                  </td>

                  <td>{leave.reason}</td>

                  <td>{leave.status}</td>

                  <td style={{ textAlign: "center" }}>
                    {leave.status === "Pending" ? (
                      <>
                        <button
                          onClick={() =>
                            updateStatus(
                              leave._id,
                              "Approved"
                            )
                          }
                          style={{
                            backgroundColor: "green",
                            color: "white",
                            padding: "6px 10px",
                            marginRight: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(
                              leave._id,
                              "Rejected"
                            )
                          }
                          style={{
                            backgroundColor: "red",
                            color: "white",
                            padding: "6px 10px",
                            cursor: "pointer",
                          }}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span>No Action Required</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
}

export default AdminLeaves;