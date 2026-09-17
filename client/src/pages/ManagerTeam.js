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
      const token = sessionStorage.getItem("token");

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

  /*
    The /users/my-team API returns the manager's team members,
    but it does not include the logged-in manager.

    So we count:
    - Managers already present in the team data
    - + the currently logged-in manager
  */
  const managers =
    employees.filter((emp) => emp.role === "manager").length + 1;

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

        {/* TOTAL MEMBERS */}

        <div className="stat-card">

          <div className="stat-icon blue">
            👥
          </div>

          <div className="stat-content">

            <h2>{totalMembers}</h2>

            <p>Total Members</p>

          </div>

        </div>


        {/* DEPARTMENTS */}

        <div className="stat-card">

          <div className="stat-icon purple">
            🏢
          </div>

          <div className="stat-content">

            <h2>{departments}</h2>

            <p>Departments</p>

          </div>

        </div>


        {/* EMPLOYEES */}

        <div className="stat-card">

          <div className="stat-icon green">
            🟢
          </div>

          <div className="stat-content">

            <h2>{activeMembers}</h2>

            <p>Employees</p>

          </div>

        </div>


        {/* MANAGERS */}

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


                {/* EMPLOYEE TOP */}

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


                {/* EMPLOYEE BODY */}

                <div className="employee-body">

                  <div className="info-box">


                    {/* DEPARTMENT */}

                    <div className="info-item">

                      <div className="info-icon">
                        🏢
                      </div>

                      <div>

                        <small>Department</small>

                        <h4>
                          {employee.department || "N/A"}
                        </h4>

                      </div>

                    </div>


                    {/* ROLE */}

                    <div className="info-item">

                      <div className="info-icon">
                        💼
                      </div>

                      <div>

                        <small>Role</small>

                        <span className="role-badge">
                          {employee.role}
                        </span>

                      </div>

                    </div>


                    {/* STATUS */}

                    <div className="info-item">

                      <div className="info-icon">
                        🟢
                      </div>

                      <div>

                        <small>Status</small>

                        <span className="status-badge active">
                          Active
                        </span>

                      </div>

                    </div>


                  </div>

                </div>


                {/* VIEW PROFILE */}

                <button
                  className="view-btn"
                  onClick={() =>
                    navigate(
                      `/manager/employees/${employee._id}`
                    )
                  }
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
