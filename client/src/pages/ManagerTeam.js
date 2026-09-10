import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ManagerTeam.css";

function ManagerTeam() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await api.get("/users/my-team", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployees(data);
    } catch (error) {
      console.error("Unable to load team", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const keyword = search.toLowerCase();

    return (
      employee.name?.toLowerCase().includes(keyword) ||
      employee.email?.toLowerCase().includes(keyword) ||
      employee.department?.toLowerCase().includes(keyword)
    );
  });

  const totalMembers = employees.length;

  const departments = [
    ...new Set(
      employees
        .map((emp) => emp.department)
        .filter(Boolean)
    ),
  ].length;

  const activeMembers = employees.filter(
    (emp) => emp.role === "employee"
  ).length;

  const managers = employees.filter(
    (emp) => emp.role === "manager"
  ).length;

  if (loading) {
    return (
      <div className="manager-team-page">
        <h2>Loading Team Members...</h2>
      </div>
    );
  }

  return (
    <div className="manager-team-page">
            {/* ==========================================================
          HEADER
      ========================================================== */}

      <div className="team-header">

        <div className="team-title">

          <h1>👥 My Team Members</h1>

          <p>
            Manage your team, track employees and monitor departments.
          </p>

        </div>

        <div className="team-search">

          <input
            type="text"
            placeholder="🔍 Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

        </div>

      </div>

      {/* ==========================================================
          STATISTICS
      ========================================================== */}
<div className="team-stats">

  <div className="stat-card">

    <div className="stat-icon blue">
      👥
    </div>

    <div className="stat-content">
      <h2>{totalMembers}</h2>
      <p>Total Members</p>
    </div>

  </div>

  <div className="stat-card">

    <div className="stat-icon purple">
      🏢
    </div>

    <div className="stat-content">
      <h2>{departments}</h2>
      <p>Departments</p>
    </div>

  </div>

  <div className="stat-card">

    <div className="stat-icon green">
      🟢
    </div>

    <div className="stat-content">
      <h2>{activeMembers}</h2>
      <p>Employees</p>
    </div>

  </div>

  <div className="stat-card">

    <div className="stat-icon orange">
      👨‍💼
    </div>

    <div className="stat-content">
      <h2>{managers}</h2>
      <p>Managers</p>
    </div>

  </div>

</div>
            {/* ==========================================================
          EMPLOYEE TABLE
      ========================================================== */}

      <div className="team-table-container">

        {filteredEmployees.length === 0 ? (

          <div className="no-team">

            <h2>No Team Members Found</h2>

            <p>
              No employees are assigned to your team.
            </p>

          </div>

        ) : (
<div className="employee-grid">

  {filteredEmployees.map((employee) => (
<div
  className="employee-card"
  key={employee._id}
>

  <div className="employee-ribbon">
    Team Member
  </div>

      <div className="employee-top">

        <div className="employee-avatar">

          {employee.name
            ? employee.name.charAt(0).toUpperCase()
            : "E"}

        </div>

        <div className="employee-name">

          <h3>{employee.name}</h3>

          <p>{employee.email}</p>

        </div>

      </div>

      <div className="employee-body">
<div className="info-box">

  <div className="info-item">

    <div className="info-icon">🏢</div>

    <div>

      <small>Department</small>

      <h4>{employee.department || "N/A"}</h4>

    </div>

  </div>

  <div className="info-item">

    <div className="info-icon">💼</div>

    <div>

      <small>Role</small>

      <span className="role-badge">
        {employee.role}
      </span>

    </div>

  </div>

  <div className="info-item">

    <div className="info-icon">🟢</div>

    <div>

      <small>Status</small>

      <span className="status-badge active">
        Active
      </span>

    </div>

  </div>

</div>

      </div>
<button
  className="view-btn"
 onClick={() =>
navigate(`/manager/employees/${employee._id}`)}
>
  👁 View Profile
</button>

    </div>

  ))}

</div>
        )}

      </div>
          </div>
  );
}

export default ManagerTeam;