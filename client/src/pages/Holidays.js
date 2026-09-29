import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Holidays.css";

function Holidays() {
  const navigate = useNavigate();

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const { data } = await api.get("/holidays");

      const sortedHolidays = data.sort(
        (a, b) =>
          new Date(a.holidayDate) - new Date(b.holidayDate)
      );

      setHolidays(sortedHolidays);
    } catch (error) {
      console.error("Error loading holidays:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================
     HOLIDAY STATISTICS
  ========================================== */

  const totalHolidays = holidays.length;

  const nationalHolidays = holidays.filter(
    (holiday) => holiday.holidayType === "National"
  ).length;

  const festivalHolidays = holidays.filter(
    (holiday) => holiday.holidayType === "Festival"
  ).length;

  const companyHolidays = holidays.filter(
    (holiday) => holiday.holidayType === "Company"
  ).length;

  /* ==========================================
     SEARCH
  ========================================== */

  const filteredHolidays = holidays.filter((holiday) => {
    return (
      holiday.holidayName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      holiday.holidayType
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  });

  /* ==========================================
     GROUP HOLIDAYS BY DATE
  ========================================== */

  const groupedHolidays = filteredHolidays.reduce(
    (groups, holiday) => {
      const dateKey = new Date(
        holiday.holidayDate
      ).toLocaleDateString("en-CA");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(holiday);

      return groups;
    },
    {}
  );

  return (
    <div className="holidays-page">

      {/* ================= BACK BUTTON ================= */}

      <div className="holiday-back-container">
        <button
          className="holiday-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>

      {/* ================= HEADER ================= */}

      <div className="holidays-header">

        <div className="holiday-title">

          <div className="holiday-icon">
            📅
          </div>

          <div>

            <h1>Holiday Management</h1>

            <p>
              View company holidays, festivals and national holidays.
            </p>

          </div>

        </div>

      </div>

      {/* ================= STATISTICS ================= */}

      <div className="holiday-stats">

        <div className="holiday-stat-card total-card">

          <div className="holiday-stat-icon">
            📅
          </div>

          <div>
            <h2>{totalHolidays}</h2>
            <p>Total Holidays</p>
          </div>

        </div>

        <div className="holiday-stat-card national-card">

          <div className="holiday-stat-icon">
            🇮🇳
          </div>

          <div>
            <h2>{nationalHolidays}</h2>
            <p>National Holidays</p>
          </div>

        </div>

        <div className="holiday-stat-card festival-card">

          <div className="holiday-stat-icon">
            🎉
          </div>

          <div>
            <h2>{festivalHolidays}</h2>
            <p>Festival Holidays</p>
          </div>

        </div>

        <div className="holiday-stat-card company-card">

          <div className="holiday-stat-icon">
            🏢
          </div>

          <div>
            <h2>{companyHolidays}</h2>
            <p>Company Holidays</p>
          </div>

        </div>

      </div>

      {/* ================= SEARCH ================= */}

      <div className="holiday-search">

        <input
          type="text"
          placeholder="🔍 Search holiday by name or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      {/* ================= EXISTING FUNCTIONALITY ================= */}

      {loading ? (

        <div className="no-holidays">

          <h3>Loading holidays...</h3>

        </div>

      ) : filteredHolidays.length === 0 ? (

        <div className="no-holidays">

          <h3>No Holidays Available</h3>

          <p>
            The administrator has not added any holidays yet.
          </p>

        </div>

      ) : (

        <div className="holiday-list">

          {/* ==========================================
              ONE CARD FOR EACH DATE
          ========================================== */}

          {Object.entries(groupedHolidays).map(
            ([dateKey, holidaysOnSameDate]) => {

              const firstHoliday = holidaysOnSameDate[0];

              const holidayDate = new Date(
                firstHoliday.holidayDate
              );

              const daysRemaining = Math.ceil(
                (holidayDate - new Date()) /
                  (1000 * 60 * 60 * 24)
              );

              return (

                <div
                  className="holiday-card"
                  key={dateKey}
                >

                  {/* ================= DATE ================= */}

                  <div className="holiday-top">

                    <h2>
                      📅{" "}
                      {holidayDate.toLocaleDateString()}
                    </h2>

                    <p className="holiday-countdown">

                      ⏳{" "}

                      {daysRemaining > 0
                        ? `${daysRemaining} days remaining`
                        : daysRemaining === 0
                        ? "Today"
                        : "Holiday completed"}

                    </p>

                  </div>

                  {/* ==========================================
                      ALL HOLIDAYS FOR THIS DATE
                  ========================================== */}

                  <div className="same-date-holidays">

                    {holidaysOnSameDate.map(
                      (holiday) => (

                        <div
                          className="holiday-item"
                          key={holiday._id}
                        >

                          <div className="holiday-item-header">

                            <h2>
                              🎉 {holiday.holidayName}
                            </h2>

                            <span className="holiday-type">
                              {holiday.holidayType}
                            </span>

                          </div>

                          <p>

                            <strong>📅 Date:</strong>{" "}

                            {new Date(
                              holiday.holidayDate
                            ).toLocaleDateString()}

                          </p>

                          <p>

                            <strong>📝 Description:</strong>{" "}

                            {holiday.description ||
                              "No description available"}

                          </p>

                        </div>

                      )
                    )}

                  </div>

                </div>

              );

            }
          )}

        </div>

      )}

    </div>
  );
}

export default Holidays;