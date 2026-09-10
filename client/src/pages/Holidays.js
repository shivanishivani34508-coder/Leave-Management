import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./Holidays.css";

function Holidays() {
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

  return (
    <div className="holidays-page">

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

      {filteredHolidays.map((holiday) => (

        <div
          className="holiday-card"
          key={holiday._id}
        >

          <div className="holiday-top">

            <h2>{holiday.holidayName}</h2>

            <p className="holiday-countdown">

              ⏳{" "}
              {Math.ceil(
                (new Date(holiday.holidayDate) -
                  new Date()) /
                  (1000 * 60 * 60 * 24)
              )}{" "}
              days remaining

            </p>

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

      ))}

    </div>

  )}

</div>
  );
}

export default Holidays;