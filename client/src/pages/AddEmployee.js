import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./AddEmployee.css";

function AddEmployee() {
  const navigate = useNavigate();

  /* =========================================================
     STATES
  ========================================================= */
const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  role: "employee",
  gender: "",
  department: "",
  manager: "",
  departmentHead: "",
});

  const [managers, setManagers] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =========================================================
   LOAD MANAGERS, DEPARTMENT HEADS & DEPARTMENTS
========================================================= */

useEffect(() => {
  const loadUsers = async () => {
    try {
      const [
        managerResponse,
        departmentHeadResponse,
        departmentResponse,
      ] = await Promise.all([
        api.get("/users/managers"),
        api.get("/users/department-heads"),
        api.get("/departments"),
      ]);

      setManagers(managerResponse.data || []);
      setDepartmentHeads(
        departmentHeadResponse.data || []
      );
      setDepartments(
         departmentResponse.data || []
      );

    } catch (error) {
      console.error(
        "Unable to load managers, department heads and departments.",
        error
      );
    }
  };

  loadUsers();
}, []);
  /* =========================================================
     HANDLE INPUT CHANGE
  ========================================================= */
const handleChange = async (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));

  if (name === "department") {
    try {
      const [
        managerResponse,
        departmentHeadResponse,
      ] = await Promise.all([
        api.get(`/users/managers?department=${encodeURIComponent(value)}`),
        api.get(`/users/department-heads?department=${encodeURIComponent(value)}`),
      ]);

      setManagers(managerResponse.data || []);
      setDepartmentHeads(departmentHeadResponse.data || []);
    } catch (error) {
      console.error("Unable to load department users", error);
    }
  }
};
  /* =========================================================
     CREATE EMPLOYEE
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/users/employee",
        {
          name,
          email,
          password,
          role: formData.role,
          gender: formData.gender,
          department: formData.department,
          manager: formData.manager || null,
          departmentHead:
            formData.departmentHead || null,
        }
      );

      setMessage(
        response.data.message ||
          "Employee created successfully."
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        gender: "",
        department: "",
        manager: "",
        departmentHead: "",
      });
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Unable to create employee."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="add-employee-page">

      <div className="add-employee-container">

        <div className="add-employee-header">

          <div>

<h1 style={{ color: "red" }}>
  TEST ADD EMPLOYEE PAGE
</h1>
            <p>
              Create Employee, Manager,
              Department Head and HR accounts.
            </p>

          </div>

          <button
            type="button"
            className="add-employee-back-button"
            onClick={() =>
              navigate("/admin-dashboard")
            }
          >
            ← Back
          </button>

        </div>

        {message && (
          <div className="add-employee-success">
            {message}
          </div>
        )}

        {error && (
          <div className="add-employee-error">
            {error}
          </div>
        )}

        <form
          className="add-employee-form"
          onSubmit={handleSubmit}
        >
          {/* =====================================================
              ROLE
          ===================================================== */}

          <div className="add-employee-form-group">

            <label htmlFor="role">
              Role
            </label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="employee">
                Employee
              </option>

              <option value="manager">
                Manager
              </option>

              <option value="departmentHead">
                Department Head
              </option>

              <option value="hr">
                HR
              </option>

              <option value="admin">
                Admin
              </option>

            </select>

          </div>

          {/* =====================================================
    FULL NAME
===================================================== */}

<div className="add-employee-form-group">

  <label htmlFor="name">
    Full Name
  </label>

  <input
    id="name"
    type="text"
    name="name"
    placeholder="Enter employee full name"
    value={formData.name}
    onChange={handleChange}
    required
  />

</div>

         
          {/* =====================================================
    GENDER
===================================================== */}

<div className="add-employee-form-group">

  <label htmlFor="gender">
    Gender
  </label>

  <select
    id="gender"
    name="gender"
    value={formData.gender}
    onChange={handleChange}
    required
  >
    <option value="">
      Select Gender
    </option>

    <option value="Male">
      Male
    </option>

    <option value="Female">
      Female
    </option>

    <option value="Other">
      Other
    </option>

  </select>

</div>


          {/* =====================================================
              DEPARTMENT
          ===================================================== */}

          <div className="add-employee-form-group">

            <label htmlFor="department">
              Department
            </label>
        <select
          id="department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          required
        >
          <option value="">
            Select Department
          </option>

          {departments.map((department) => (
            <option
              key={department._id}
              value={department.name}
            >
              {department.name}
            </option>
          ))}
        </select>

          </div>


          {/* =====================================================
              MANAGER
          ===================================================== */}

          <div className="add-employee-form-group">

            <label htmlFor="manager">
              Manager
            </label>

            <select
              id="manager"
              name="manager"
              value={formData.manager}
              onChange={handleChange}
            >

              <option value="">
                Select Manager
              </option>

              {managers.map((manager) => (

                <option
                  key={manager._id}
                  value={manager._id}
                >
                  {manager.name}
                </option>

              ))}

            </select>

          </div>


          {/* =====================================================
              DEPARTMENT HEAD
          ===================================================== */}

          <div className="add-employee-form-group">

            <label htmlFor="departmentHead">
              Department Head
            </label>

            <select
              id="departmentHead"
              name="departmentHead"
              value={formData.departmentHead}
              onChange={handleChange}
            >

              <option value="">
                Select Department Head
              </option>

              {departmentHeads.map((head) => (

                <option
                  key={head._id}
                  value={head._id}
                >
                  {head.name}
                </option>

              ))}

            </select>

          </div>


          {/* =====================================================
              EMAIL
          ===================================================== */}

          <div className="add-employee-form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="employee@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

          </div>


          {/* =====================================================
              PASSWORD
          ===================================================== */}

          <div className="add-employee-form-group">

            <label htmlFor="password">
              Temporary Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />

          </div>
                    {/* =====================================================
              SUBMIT BUTTON
          ===================================================== */}

          <button
            type="submit"
            className="add-employee-submit-button"
            disabled={loading}
          >
            {loading
              ? "Creating Employee..."
              : "Create Employee"}
          </button>

        </form>

      </div>

    </div>
  );
}

export default AddEmployee;