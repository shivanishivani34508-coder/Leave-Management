import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./EditEmployee.css";

function EditEmployee() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [managers, setManagers] = useState([]);
  const [departmentHeads, setDepartmentHeads] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
    role: "employee",
    department: "",
    manager: "",
    departmentHead: "",
  });

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  const fetchEmployee = async () => {
    try {
      setLoading(true);

      const employeeRes = await api.get(
        `/users/${id}`,
        getAuthConfig()
      );

      const employee = employeeRes.data.user;

      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        gender: employee.gender || "",
        role: employee.role || "employee",
        department: employee.department || "",
        manager: employee.manager?._id || employee.manager || "",
        departmentHead:
          employee.departmentHead?._id ||
          employee.departmentHead ||
          "",
      });

      const managerRes = await api.get(
        "/users/managers",
        getAuthConfig()
      );

      setManagers(managerRes.data);

      const headRes = await api.get(
        "/users/department-heads",
        getAuthConfig()
      );

      setDepartmentHeads(headRes.data);

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Unable to load employee."
      );

      navigate("/employees");

    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.put(
        `/users/${id}`,
        formData,
        getAuthConfig()
      );

      alert("Employee updated successfully.");

      navigate("/employees");

    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Unable to update employee."
      );

    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-loading">
        Loading Employee...
      </div>
    );
  }
  return (
  <div className="edit-employee-page">

    {/* ========================= HEADER ========================= */}

    <div className="edit-header">

      <div>

        <h1>✏️ Edit Employee</h1>

        <p>
          Update employee information, role, department and
          reporting hierarchy.
        </p>

      </div>

      <button
        className="back-btn"
        onClick={() => navigate("/employees")}
      >
        ← Back
      </button>

    </div>

    {/* ========================= PROFILE ========================= */}

    <div className="employee-profile-card">

      <div className="employee-avatar">

        {formData.name
          ? formData.name.charAt(0).toUpperCase()
          : "E"}

      </div>

      <div className="employee-profile-info">

        <h2>{formData.name}</h2>

        <p>{formData.email}</p>

        <div className="employee-badges">

          <span className="role-badge">
            {formData.role}
          </span>

          <span className="department-badge">
            {formData.department || "No Department"}
          </span>

        </div>

      </div>

    </div>

    {/* ========================= FORM ========================= */}

    <form
      className="edit-form"
      onSubmit={handleSubmit}
    >

      {/* ================= PERSONAL ================= */}

      <div className="form-card">

        <h2>
          👤 Personal Information
        </h2>

        <div className="form-grid">

          <div className="form-field">

            <label>Full Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />

          </div>

          <div className="form-field">

            <label>Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />

          </div>

          <div className="form-field">

            <label>Gender</label>

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
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

          <div className="form-field">

            <label>Role</label>

            <select
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

            </select>

          </div>

        </div>

      </div>

      {/* ================= ORGANIZATION ================= */}

      <div className="form-card">

        <h2>
          🏢 Organization Information
        </h2>

        <div className="form-grid">

          <div className="form-field">

            <label>Department</label>

            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
            />

          </div>

          <div className="form-field">

            <label>Manager</label>

            <select
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

          <div className="form-field">

            <label>
              Department Head
            </label>

            <select
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

        </div>

      </div>

      {/* ================= BUTTONS ================= */}

      <div className="edit-actions">

        <button
          type="button"
          className="cancel-btn"
          onClick={() => navigate("/employees")}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="save-btn"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "💾 Save Changes"}
        </button>

      </div>

    </form>

  </div>
);
}

export default EditEmployee;