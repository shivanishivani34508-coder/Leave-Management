import React, { useEffect, useState } from "react";
import "./HolidayManagement.css";
import api from "../services/api";

function HolidayManagement() {
  const [holidays, setHolidays] = useState([]);

  const [formData, setFormData] = useState({
    holidayName: "",
    holidayDate: "",
    holidayType: "National",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const { data } = await api.get("/holidays");
      setHolidays(data);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (editingId) {
      // Update Holiday
      await api.put(`/holidays/${editingId}`, formData);

      alert("Holiday updated successfully!");
    } else {
      // Add Holiday
      await api.post("/holidays", formData);

      alert("Holiday added successfully!");
    }

    // Clear the form
    setFormData({
      holidayName: "",
      holidayDate: "",
      holidayType: "National",
      description: "",
    });

    // Exit edit mode
    setEditingId(null);

    // Refresh table
    fetchHolidays();

  } catch (error) {
    console.error(error);

    alert(
      error.response?.data?.message ||
      "Operation failed."
    );
  }
};

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this holiday?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/holidays/${id}`);

      alert("Holiday deleted successfully!");

      fetchHolidays();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
          "Failed to delete holiday."
      );
    }
  };
const handleEdit = (holiday) => {
  setEditingId(holiday._id);

  setFormData({
    holidayName: holiday.holidayName,
    holidayDate: holiday.holidayDate.split("T")[0],
    holidayType: holiday.holidayType,
    description: holiday.description || "",
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
  return (
    <div className="holiday-page">
      <h1>Holiday Management</h1>

      <form className="holiday-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="holidayName"
          placeholder="Holiday Name"
          value={formData.holidayName}
          onChange={handleChange}
          required
        />

        <input
          type="date"
          name="holidayDate"
          value={formData.holidayDate}
          onChange={handleChange}
          required
        />

        <select
          name="holidayType"
          value={formData.holidayType}
          onChange={handleChange}
        >
          <option value="National">National</option>
          <option value="Festival">Festival</option>
          <option value="Company">Company</option>
          <option value="Optional">Optional</option>
        </select>

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
        />
<div className="holiday-buttons">
  <button type="submit">
    {editingId ? "Update Holiday" : "Add Holiday"}
  </button>

  {editingId && (
    <button
      type="button"
      onClick={() => {
        setEditingId(null);
        setFormData({
          holidayName: "",
          holidayDate: "",
          holidayType: "National",
          description: "",
        });
      }}
    >
      Cancel
    </button>
  )}
</div>
      </form>

      <div className="holiday-table">
        <table>
          <thead>
            <tr>
              <th>Holiday Name</th>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {holidays.length === 0 ? (
              <tr>
                <td colSpan="5">No Holidays Found</td>
              </tr>
            ) : (
              holidays.map((holiday) => (
                <tr key={holiday._id}>
                  <td>{holiday.holidayName}</td>

                  <td>
                    {new Date(
                      holiday.holidayDate
                    ).toLocaleDateString()}
                  </td>

                  <td>{holiday.holidayType}</td>

                  <td>{holiday.description}</td>

                  <td>
                    <button
  className="holiday-edit-btn"
  onClick={() => handleEdit(holiday)}
>
  ✏️ Edit
</button>

                    <button
                      className="holiday-delete-btn"
                      onClick={() =>
                        handleDelete(holiday._id)
                      }
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HolidayManagement;