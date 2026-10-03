import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function HRDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hr, setHr] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
useEffect(() => {
  fetchHRDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [id]);

  const fetchHRDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const token = sessionStorage.getItem("token");

      const response = await api.get(`/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const user = response.data?.user || response.data;

      if (!user || user.role !== "hr") {
        setError("HR account not found.");
        return;
      }

      setHr(user);

      // Get leaves of this HR
      try {
        const leaveResponse = await api.get(`/leaves/user/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const leaveData = Array.isArray(leaveResponse.data)
          ? leaveResponse.data
          : Array.isArray(leaveResponse.data?.leaves)
          ? leaveResponse.data.leaves
          : [];

        setLeaves(leaveData);
      } catch (leaveError) {
        console.log("HR leave details unavailable:", leaveError);
        setLeaves([]);
      }
    } catch (error) {
      console.error("FETCH HR DETAILS ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load HR details."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "50px",
          textAlign: "center",
        }}
      >
        <h2>Loading HR details...</h2>
      </div>
    );
  }

  if (error || !hr) {
    return (
      <div
        style={{
          padding: "60px",
          textAlign: "center",
        }}
      >
        <h2>HR Not Found</h2>

        <p>
          {error || "The selected HR account could not be found."}
        </p>

        <button
          type="button"
          onClick={() => navigate("/admin/hr")}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            border: "none",
            borderRadius: "8px",
            background: "#2864e8",
            color: "white",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          Back to HR Management
        </button>
      </div>
    );
  }

  const balance =
    hr.leaveBalances ||
    hr.leaveBalance ||
    {};

  const totalRequests = leaves.length;

  const approvedLeaves = leaves.filter(
    (leave) => leave.status === "Approved"
  ).length;

  const pendingLeaves = leaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  const rejectedLeaves = leaves.filter(
    (leave) => leave.status === "Rejected"
  ).length;

  const totalDays = leaves.reduce(
    (total, leave) =>
      total + Number(leave.totalDays || 0),
    0
  );

  const paidDays = leaves.reduce(
    (total, leave) =>
      total + Number(leave.paidDays || 0),
    0
  );

  const unpaidDays = leaves.reduce(
    (total, leave) =>
      total + Number(leave.unpaidDays || 0),
    0
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        padding: "30px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "25px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/admin/hr")}
          style={{
            border: "none",
            background: "#2864e8",
            color: "white",
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Back to HR Management
        </button>

        <h1 style={{ marginBottom: "8px" }}>
          HR Details
        </h1>

        <p>
          View complete HR profile and leave information.
        </p>
      </div>

      {/* PROFILE */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "25px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Profile Information</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div>
            <strong>Name</strong>
            <p>{hr.name || "-"}</p>
          </div>

          <div>
            <strong>Email</strong>
            <p>{hr.email || "-"}</p>
          </div>

          <div>
            <strong>Department</strong>
            <p>{hr.department || "-"}</p>
          </div>

          <div>
            <strong>Role</strong>
            <p>HR</p>
          </div>
        </div>
      </div>

      {/* LEAVE BALANCES */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "25px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Leave Balances</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "18px",
            marginTop: "20px",
          }}
        >
          <BalanceCard
            title="Casual"
            value={balance.casual ?? 0}
          />

          <BalanceCard
            title="Sick"
            value={balance.sick ?? 0}
          />

          <BalanceCard
            title="Earned"
            value={balance.earned ?? 0}
          />

          <BalanceCard
            title="Marriage"
            value={balance.marriage ?? 0}
          />

          <BalanceCard
            title="Maternity"
            value={balance.maternity ?? 0}
          />

          <BalanceCard
            title="Paternity"
            value={balance.paternity ?? 0}
          />

          <BalanceCard
            title="Bereavement"
            value={balance.bereavement ?? 0}
          />
        </div>
      </div>

      {/* LEAVE STATISTICS */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "25px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Leave Statistics</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <StatCard
            title="Total Requests"
            value={totalRequests}
          />

          <StatCard
            title="Approved"
            value={approvedLeaves}
          />

          <StatCard
            title="Pending"
            value={pendingLeaves}
          />

          <StatCard
            title="Rejected"
            value={rejectedLeaves}
          />
        </div>
      </div>

      {/* APPROVED LEAVE USAGE */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          marginBottom: "25px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Approved Leave Usage</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <StatCard
            title="Total Days"
            value={totalDays}
          />

          <StatCard
            title="Paid Days"
            value={paidDays}
          />

          <StatCard
            title="Unpaid Days"
            value={unpaidDays}
          />
        </div>
      </div>

      {/* LEAVE HISTORY */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
        }}
      >
        <h2>Leave History</h2>

        {leaves.length === 0 ? (
          <p style={{ marginTop: "20px" }}>
            No leave history available.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              marginTop: "20px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#2864e8",
                    color: "white",
                  }}
                >
                  <th style={thStyle}>Leave Type</th>
                  <th style={thStyle}>Start Date</th>
                  <th style={thStyle}>End Date</th>
                  <th style={thStyle}>Total Days</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id}>
                    <td style={tdStyle}>
                      {leave.leaveType || "-"}
                    </td>

                    <td style={tdStyle}>
                      {leave.startDate
                        ? new Date(
                            leave.startDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      {leave.endDate
                        ? new Date(
                            leave.endDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      {leave.totalDays ?? 0}
                    </td>

                    <td style={tdStyle}>
                      {leave.status || "-"}
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

function BalanceCard({ title, value }) {
  return (
    <div
      style={{
        padding: "20px",
        background: "#eef8f2",
        borderRadius: "12px",
        textAlign: "center",
      }}
    >
      <strong>{title}</strong>

      <h2 style={{ marginTop: "10px" }}>
        {value}
      </h2>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        padding: "22px",
        border: "2px solid #2864e8",
        borderRadius: "12px",
      }}
    >
      <span>{title}</span>

      <h2 style={{ marginTop: "10px" }}>
        {value}
      </h2>
    </div>
  );
}

const thStyle = {
  padding: "14px",
  textAlign: "left",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #ddd",
};

export default HRDetails;