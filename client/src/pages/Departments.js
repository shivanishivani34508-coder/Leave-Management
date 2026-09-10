import { useEffect, useState } from "react";
import api from "../services/api";
import "./Departments.css";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingDepartment, setEditingDepartment] = useState(null);
const totalDepartments = departments.length;

const activeDepartments = departments.filter(
  (department) => department.status === "Active"
).length;

const totalEmployees = employees.length;

const totalManagers = managers.length;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

 useEffect(() => {
  loadDepartments();
  loadEmployees();
}, []);

  const loadDepartments = async () => {
    try {
      const { data } = await api.get("/departments");
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadEmployees = async () => {
  try {
    const { data } = await api.get("/users");

     console.log("ALL USERS:", data);

    setEmployees(data);

    const managerList = data.filter(
      (user) => user.role === "manager"
    );


    console.log("MANAGERS:", managerList);

    setManagers(managerList);

   console.log("TOTAL USERS:", data.length);

  } catch (error) {
    console.error("Error loading employees:", error);
  }
};

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);

    setFormData({
      name: department.name,
      code: department.code,
      description: department.description || "",
    });

    setShowModal(true);
  };

  const handleSaveDepartment = async () => {
    try {
      if (!formData.name.trim() || !formData.code.trim()) {
        alert("Department Name and Code are required.");
        return;
      }

      if (editingDepartment) {
        await api.put(
          `/departments/${editingDepartment._id}`,
          formData
        );

        alert("Department updated successfully.");
      } else {
        await api.post("/departments", formData);

        alert("Department added successfully.");
      }

      setShowModal(false);

      setEditingDepartment(null);

      setFormData({
        name: "",
        code: "",
        description: "",
      });

      loadDepartments();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Unable to save department."
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this department?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/departments/${id}`);

      alert("Department deleted successfully.");

      loadDepartments();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Unable to delete department."
      );
    }
  };

  const filteredDepartments = departments.filter((department) =>
  department.name.toLowerCase().includes(search.toLowerCase()) ||
  department.code.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className="departments-page">
<div className="department-header">

  <div className="department-left">

    <div className="department-icon">
      🏢
    </div>

    <div>

      <h1 className="department-title">
        Department Management
      </h1>

      <p className="department-subtitle">
        Manage departments, department heads and employees.
      </p>

    </div>

  </div>

  <button
    className="add-btn"
    onClick={() => {
      setEditingDepartment(null);

      setFormData({
        name: "",
        code: "",
        description: "",
      });

      setShowModal(true);
    }}
  >
    + Add Department
  </button>

</div>
<div className="stats-grid">

  <div className="stat-card department-card1">

    <div className="stat-icon">
      🏢
    </div>

    <div className="stat-content">

      <h2>{totalDepartments}</h2>

      <p>Total Departments</p>

    </div>

  </div>

  <div className="stat-card employee-card">

    <div className="stat-icon">
      👥
    </div>

    <div className="stat-content">

      <h2>{totalEmployees}</h2>

      <p>Total Employees</p>

    </div>

  </div>

  <div className="stat-card manager-card">

    <div className="stat-icon">
      👨‍💼
    </div>

    <div className="stat-content">

      <h2>{totalManagers}</h2>

      <p>Managers</p>

    </div>

  </div>

  <div className="stat-card active-card">

    <div className="stat-icon">
      ✅
    </div>

    <div className="stat-content">

      <h2>{activeDepartments}</h2>

      <p>Active Departments</p>

    </div>

  </div>

</div>
  <div className="department-card">
  
  <div className="department-search">

  <input
    type="text"
    placeholder="🔍 Search by department name or code..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

</div>

  <div className="department-table">

    <table>

      <thead>

        <tr>
          <th>Department</th>
          <th>Code</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>

      </thead>

     <tbody>

{departments.length === 0 ? (

<tr>

<td colSpan="4" className="empty-row">
No Departments Found
</td>

</tr>

) : (

filteredDepartments.map((department) => (
<tr key={department._id}>

<td colSpan="4">

<div className="department-item">

<div className="department-info">

<div className="department-avatar">
🏢
</div>

<div className="department-details">

<h3>{department.name}</h3>

<p>
Department Code :
<strong> {department.code}</strong>
</p>

</div>

</div>

<div className="department-status">

<span className="status-badge">
🟢 {department.status}
</span>

</div>

<div className="department-actions">

<button
className="edit-btn"
onClick={() => handleEdit(department)}
>
✏ Edit
</button>

<button
className="delete-btn"
onClick={() => handleDelete(department._id)}
>
🗑 Delete
</button>

</div>

</div>

</td>

</tr>

))

)}

</tbody>

      </table>

  </div>

</div>

  {showModal && (

    <div className="modal-overlay">

      <div className="department-modal">

        <h2>

          {editingDepartment
            ? "Edit Department"
            : "Add Department"}

        </h2>

        <input
          type="text"
          name="name"
          placeholder="Department Name"
          value={formData.name}
          onChange={handleChange}
        />

        <input
          type="text"
          name="code"
          placeholder="Department Code"
          value={formData.code}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Department Description"
          value={formData.description}
          onChange={handleChange}
        />
                <div className="modal-buttons">

          <button
            className="cancel-btn"
            onClick={() => {
              setShowModal(false);

              setEditingDepartment(null);

              setFormData({
                name: "",
                code: "",
                description: "",
              });
            }}
          >
            Cancel
          </button>

          <button
            className="save-btn"
            onClick={handleSaveDepartment}
          >
            {editingDepartment
              ? "Update Department"
              : "Save Department"}
          </button>

        </div>

      </div>

    </div>

  )}

</div>

  );
}

export default Departments;