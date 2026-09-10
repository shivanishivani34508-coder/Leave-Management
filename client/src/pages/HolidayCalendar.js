import React, { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./HolidayCalendar.css";
import api from "../services/api";

function HolidayCalendar() {
  const [date, setDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayType, setHolidayType] = useState("Public");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [editHolidayName, setEditHolidayName] = useState("");
  const [editHolidayDate, setEditHolidayDate] = useState("");
  const [editHolidayType, setEditHolidayType] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const { data } = await api.get("/holidays");
      setHolidays(data);
    } catch (error) {
      console.error("Error loading holidays:", error);
    }
  };

  const isSameDate = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);

    const holiday = holidays.find((item) =>
      isSameDate(item.holidayDate, selectedDate)
    );

    setSelectedHoliday(holiday || null);
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();

    try {
      setMessage("");

      const response = await api.post("/holidays", {
        holidayName,
        holidayDate,
        holidayType,
        description,
      });

      setMessage(
        response.data.message || "Holiday added successfully!"
      );

      setHolidayName("");
      setHolidayDate("");
      setHolidayType("Public");
      setDescription("");

      fetchHolidays();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to add holiday."
      );
    }
  };

  /* =====================================================
   EDIT HOLIDAY
===================================================== */

const handleEditHoliday = (holiday) => {
  setEditingHoliday(holiday);

  setEditHolidayName(holiday.holidayName);

  const formattedDate = new Date(holiday.holidayDate)
    .toISOString()
    .split("T")[0];

  setEditHolidayDate(formattedDate);

  setEditHolidayType(holiday.holidayType);

  setEditDescription(holiday.description || "");

  setMessage("");
};


/* =====================================================
   UPDATE HOLIDAY
===================================================== */

const handleUpdateHoliday = async (e) => {
  e.preventDefault();

  try {
    setMessage("");

    const response = await api.put(
      `/holidays/${editingHoliday._id}`,
      {
        holidayName: editHolidayName,
        holidayDate: editHolidayDate,
        holidayType: editHolidayType,
        description: editDescription,
      }
    );

    setMessage(
      response.data.message ||
        "Holiday updated successfully!"
    );

    setEditingHoliday(null);

    setEditHolidayName("");
    setEditHolidayDate("");
    setEditHolidayType("");
    setEditDescription("");

    await fetchHolidays();

  } catch (error) {
    console.error("Error updating holiday:", error);

    setMessage(
      error.response?.data?.message ||
        "Failed to update holiday."
    );
  }
};


/* =====================================================
   DELETE HOLIDAY
===================================================== */

const handleDeleteHoliday = async (holiday) => {
  const confirmDelete = window.confirm(
    `Are you sure you want to delete "${holiday.holidayName}"?`
  );

  if (!confirmDelete) {
    return;
  }

  try {
    setMessage("");

    const response = await api.delete(
      `/holidays/${holiday._id}`
    );

    setMessage(
      response.data.message ||
        "Holiday deleted successfully!"
    );

    if (
      selectedHoliday &&
      selectedHoliday._id === holiday._id
    ) {
      setSelectedHoliday(null);
    }

    await fetchHolidays();

  } catch (error) {
    console.error("Error deleting holiday:", error);

    setMessage(
      error.response?.data?.message ||
        "Failed to delete holiday."
    );
  }
};

  const getHolidayStatus = (holidayDateValue) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hDate = new Date(holidayDateValue);
    hDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (hDate - today) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > 0) {
      return (
        <span className="holiday-status upcoming">
          ⏳ {diffDays} days remaining
        </span>
      );
    }

    if (diffDays === 0) {
      return (
        <span className="holiday-status today">
          🎉 Holiday today
        </span>
      );
    }

    return (
      <span className="holiday-status completed">
        ✓ Completed
      </span>
    );
  };

  const upcomingHolidays = holidays.filter((holiday) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hDate = new Date(holiday.holidayDate);
    hDate.setHours(0, 0, 0, 0);

    return hDate >= today;
  });

  return (
    <div className="holiday-calendar-page">
      <div className="holiday-page-container">

        {/* HEADER */}
        <div className="holiday-calendar-header">
          <div>
            <span className="page-label">
              COMPANY HOLIDAYS
            </span>

            <h1>📅 Holiday Calendar</h1>

            <p>
              Manage company holidays and keep your team informed.
            </p>
          </div>

          <div className="holiday-total-card">
            <span>Total Holidays</span>
            <strong>{holidays.length}</strong>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="holiday-main-grid">

          {/* ADD HOLIDAY */}
          <div className="add-holiday-card">
            <div className="section-heading">
              <div className="section-icon">
                ➕
              </div>

              <div>
                <h2>Add New Holiday</h2>
                <p>Add a company holiday manually.</p>
              </div>
            </div>

            {message && (
              <div className="holiday-message">
                {message}
              </div>
            )}

            <form onSubmit={handleAddHoliday}>

              <div className="form-group">
                <label>Holiday Name</label>

                <input
                  type="text"
                  placeholder="Enter holiday name"
                  value={holidayName}
                  onChange={(e) =>
                    setHolidayName(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-row">

                <div className="form-group">
                  <label>Holiday Date</label>

                  <input
                    type="date"
                    value={holidayDate}
                    onChange={(e) =>
                      setHolidayDate(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Holiday Type</label>

                  <select
                    value={holidayType}
                    onChange={(e) =>
                      setHolidayType(e.target.value)
                    }
                  >
                    <option value="Public">
                      Public
                    </option>

                    <option value="Company">
                      Company
                    </option>

                    <option value="Optional">
                      Optional
                    </option>

                    <option value="Festival">
                      Festival
                    </option>
                  </select>
                </div>

              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  placeholder="Enter description (optional)"
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                />
              </div>

              <button
                type="submit"
                className="add-holiday-btn"
              >
                <span>＋</span>
                Add Holiday
              </button>

            </form>
          </div>

          {/* CALENDAR */}
          <div className="calendar-card">

            <div className="section-heading">
              <div className="section-icon">
                🗓️
              </div>

              <div>
                <h2>Calendar</h2>
                <p>Select a date to view holiday details.</p>
              </div>
            </div>

            <div className="modern-calendar">
              <Calendar
                onChange={handleDateChange}
                value={date}
                tileContent={({ date, view }) => {
                  if (view !== "month") return null;

                  const holiday = holidays.find((item) =>
                    isSameDate(item.holidayDate, date)
                  );

                  return holiday ? (
                    <div className="holiday-dot">
                      🎉
                    </div>
                  ) : null;
                }}
              />
            </div>

          </div>

        </div>

        {/* =====================================================
    EDIT HOLIDAY FORM
===================================================== */}

{editingHoliday && (
  <div className="edit-holiday-overlay">
    <div className="edit-holiday-modal">

      <div className="edit-holiday-header">
        <div>
          <span className="page-label">
            EDIT HOLIDAY
          </span>

          <h2>✏️ Edit Holiday</h2>

          <p>
            Update the company holiday details.
          </p>
        </div>

        <button
          type="button"
          className="close-edit-btn"
          onClick={() => {
            setEditingHoliday(null);
            setEditHolidayName("");
            setEditHolidayDate("");
            setEditHolidayType("");
            setEditDescription("");
          }}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleUpdateHoliday}>

        <div className="form-group">
          <label>Holiday Name</label>

          <input
            type="text"
            value={editHolidayName}
            onChange={(e) =>
              setEditHolidayName(e.target.value)
            }
            required
          />
        </div>

        <div className="form-row">

          <div className="form-group">
            <label>Holiday Date</label>

            <input
              type="date"
              value={editHolidayDate}
              onChange={(e) =>
                setEditHolidayDate(e.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Holiday Type</label>

            <select
              value={editHolidayType}
              onChange={(e) =>
                setEditHolidayType(e.target.value)
              }
              required
            >
              <option value="National">
                National
              </option>

              <option value="Festival">
                Festival
              </option>

              <option value="Company">
                Company
              </option>

              <option value="Optional">
                Optional
              </option>
            </select>
          </div>

        </div>

        <div className="form-group">
          <label>Description</label>

          <textarea
            value={editDescription}
            onChange={(e) =>
              setEditDescription(e.target.value)
            }
            placeholder="Enter description (optional)"
          />
        </div>

        <div className="edit-holiday-actions">

          <button
            type="button"
            className="cancel-edit-btn"
            onClick={() => {
              setEditingHoliday(null);
              setEditHolidayName("");
              setEditHolidayDate("");
              setEditHolidayType("");
              setEditDescription("");
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-edit-btn"
          >
            💾 Save Changes
          </button>

        </div>

      </form>

    </div>
  </div>
)}

        {/* SELECTED HOLIDAY */}
        <div className="selected-holiday-section">

          <div className="selected-date-card">
            <span>SELECTED DATE</span>
            <h3>{date.toDateString()}</h3>
          </div>

          {selectedHoliday ? (
            <div className="holiday-details-card">

              <div className="holiday-details-top">
                <div className="holiday-big-icon">
                  🎉
                </div>

                <div>
                  <span className="selected-label">
                    HOLIDAY DETAILS
                  </span>

                  <h2>
                    {selectedHoliday.holidayName}
                  </h2>
                </div>
              </div>

              <div className="holiday-detail-grid">

                <div>
                  <span>Date</span>
                  <strong>
                    {new Date(
                      selectedHoliday.holidayDate
                    ).toLocaleDateString()}
                  </strong>
                </div>

                <div>
                  <span>Type</span>
                  <strong>
                    {selectedHoliday.holidayType}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  {getHolidayStatus(
                    selectedHoliday.holidayDate
                  )}
                </div>

              </div>

              <p className="holiday-description">
                {selectedHoliday.description ||
                  "No description available for this holiday."}
              </p>

            </div>
          ) : (
            <div className="no-holiday-card">
              <div>📅</div>
              <h3>No Holiday Selected</h3>
              <p>
                Select a highlighted date from the calendar
                to view holiday information.
              </p>
            </div>
          )}

        </div>

        {/* UPCOMING HOLIDAYS */}
        <div className="upcoming-holidays-section">

          <div className="upcoming-section-header">
            <div>
              <span className="page-label">
                WHAT'S NEXT
              </span>

              <h2>Upcoming Holidays</h2>

              <p>
                Holidays and events coming up for your company.
              </p>
            </div>

            <div className="upcoming-count">
              {upcomingHolidays.length} Upcoming
            </div>
          </div>

          {upcomingHolidays.length === 0 ? (
            <div className="empty-holidays">
              🎉 No upcoming holidays available.
            </div>
          ) : (
            <div className="upcoming-holidays-grid">

              {upcomingHolidays.map((holiday) => {
                const holidayDateObject = new Date(
                  holiday.holidayDate
                );

                return (
                  <div
                    key={holiday._id}
                    className="upcoming-holiday-card"
                    onClick={() => {
                      setDate(holidayDateObject);
                      setSelectedHoliday(holiday);
                    }}
                  >

                    <div className="holiday-date-box">
                      <strong>
                        {String(
                          holidayDateObject.getDate()
                        ).padStart(2, "0")}
                      </strong>

                      <span>
                        {holidayDateObject
                          .toLocaleString("default", {
                            month: "short",
                          })
                          .toUpperCase()}
                      </span>
                    </div>

                    <div className="upcoming-holiday-info">

                      <h3>
                        🎉 {holiday.holidayName}
                      </h3>

                      <p>
                        {holidayDateObject.toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>

                      <span
                        className={`holiday-type-badge ${holiday.holidayType.toLowerCase()}`}
                      >
                        {holiday.holidayType}
                      </span>

                    </div>

                   <div className="upcoming-actions">
                    <button
                      type="button"
                      className="edit-holiday-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditHoliday(holiday);
                      }}
                    >
                      ✏️ Edit
                    </button>

                    <button
                      type="button"
                      className="delete-holiday-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHoliday(holiday);
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <div className="upcoming-status">
                    {getHolidayStatus(
                      holiday.holidayDate
                    )}
                  </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

export default HolidayCalendar;