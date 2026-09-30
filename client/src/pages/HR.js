import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

import "./Employees.css";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


function HR() {
  const navigate = useNavigate();

  const [hrUsers, setHrUsers] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");


  /* =========================================================
     AUTH CONFIG
  ========================================================= */

  const getAuthConfig = () => {
    const token =
      sessionStorage.getItem("token") ||
      localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };


  /* =========================================================
     LOGOUT WHEN TOKEN IS INVALID
  ========================================================= */

  const handleUnauthorized = useCallback(() => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", {
      replace: true,
    });
  }, [navigate]);


  /* =========================================================
     FETCH HR USERS
  ========================================================= */

  const fetchHRUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        sessionStorage.getItem("token") ||
        localStorage.getItem("token");

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await api.get(
        "/users",
        getAuthConfig()
      );

      const users = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.users)
        ? response.data.users
        : [];

      /* ONLY HR USERS */

      const filteredHR = users.filter(
        (user) => user.role === "hr"
      );

      setHrUsers(filteredHR);

    } catch (error) {
      console.error(
        "FETCH HR USERS ERROR:",
        error
      );

      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (error.response?.status === 403) {
        setError(
          "Access denied. Admin account is required."
        );
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to load HR users."
      );

    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);


  /* =========================================================
     LOAD HR USERS
  ========================================================= */

  useEffect(() => {
    fetchHRUsers();
  }, [fetchHRUsers]);


  /* =========================================================
     GET LEAVE BALANCES
  ========================================================= */

  const getBalances = (user) => {
    const balances =
      user?.leaveBalance ||
      user?.leaveBalances ||
      {};

    return {
      casual: Number(
        balances.casual ?? 0
      ),

      sick: Number(
        balances.sick ?? 0
      ),

      earned: Number(
        balances.earned ?? 0
      ),

      marriage: Number(
        balances.marriage ?? 0
      ),

      maternity: Number(
        balances.maternity ?? 0
      ),

      paternity: Number(
        balances.paternity ?? 0
      ),

      bereavement: Number(
        balances.bereavement ?? 0
      ),
    };
  };


  /* =========================================================
     GET STATISTICS
  ========================================================= */

  const getStatistics = (user) => {
    const statistics =
      user?.statistics || {};

    return {
      total: Number(
        statistics.total ?? 0
      ),

      approved: Number(
        statistics.approved ?? 0
      ),

      pending: Number(
        statistics.pending ?? 0
      ),

      rejected: Number(
        statistics.rejected ?? 0
      ),
    };
  };


  /* =========================================================
     DELETE HR
  ========================================================= */

  const deleteHR = async (user) => {
    if (!user?._id) {
      setError("HR ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await api.delete(
        `/users/${user._id}`,
        getAuthConfig()
      );

      setHrUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) =>
            currentUser._id !== user._id
        )
      );

      setMessage(
        response.data?.message ||
          "HR user deleted successfully."
      );

    } catch (error) {
      console.error(
        "DELETE HR ERROR:",
        error
      );

      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }

      if (error.response?.status === 403) {
        setError(
          "Access denied. Only admin can delete HR users."
        );
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to delete HR user."
      );
    }
  };


  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredHR = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    if (!searchText) {
      return hrUsers;
    }

    return hrUsers.filter((user) => {
      const name =
        user.name?.toLowerCase() || "";

      const email =
        user.email?.toLowerCase() || "";

      const department =
        user.department?.toLowerCase() || "";

      return (
        name.includes(searchText) ||
        email.includes(searchText) ||
        department.includes(searchText)
      );
    });

  }, [hrUsers, search]);


  /* =========================================================
     TOTAL STATISTICS
  ========================================================= */

  const totals = useMemo(() => {
    return hrUsers.reduce(
      (result, user) => {
        const statistics =
          getStatistics(user);

        result.requests +=
          statistics.total;

        result.approved +=
          statistics.approved;

        result.pending +=
          statistics.pending;

        return result;
      },
      {
        requests: 0,
        approved: 0,
        pending: 0,
      }
    );
  }, [hrUsers]);


  /* =========================================================
     HR INITIALS
  ========================================================= */

  const getInitials = (name = "") => {
    if (!name) {
      return "H";
    }

    const words = name
      .trim()
      .split(/\s+/);

    if (words.length === 1) {
      return words[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  };


  /* =========================================================
     EXPORT PDF
  ========================================================= */

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "HR Report",
      14,
      20
    );

    const tableData = hrUsers.map(
      (user) => {
        const balances =
          getBalances(user);

        const statistics =
          getStatistics(user);

        return [
          user.name,
          user.email,
          user.department || "-",
          balances.casual,
          balances.sick,
          balances.earned,
          balances.marriage,
          statistics.total,
          statistics.approved,
          statistics.pending,
        ];
      }
    );

    autoTable(doc, {
      startY: 30,

      head: [[
        "Name",
        "Email",
        "Department",
        "Casual",
        "Sick",
        "Earned",
        "Marriage",
        "Total",
        "Approved",
        "Pending",
      ]],

      body: tableData,
    });

    doc.save(
      "HR_Report.pdf"
    );
  };


  /* =========================================================
     EXPORT EXCEL
  ========================================================= */

  const exportExcel = () => {
    const excelData =
      hrUsers.map((user) => {
        const balances =
          getBalances(user);

        const statistics =
          getStatistics(user);

        return {
          Name: user.name,

          Email: user.email,

          Department:
            user.department || "-",

          Role: user.role,

          Casual:
            balances.casual,

          Sick:
            balances.sick,

          Earned:
            balances.earned,

          Marriage:
            balances.marriage,

          Maternity:
            balances.maternity,

          Paternity:
            balances.paternity,

          Bereavement:
            balances.bereavement,

          "Total Requests":
            statistics.total,

          Approved:
            statistics.approved,

          Pending:
            statistics.pending,

          Rejected:
            statistics.rejected,
        };
      });

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "HR"
    );

    const excelBuffer =
      XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

    const file = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      }
    );

    saveAs(
      file,
      "HR_Report.xlsx"
    );
  };


  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="employees-page">

      <div className="employees-container">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="employees-hero">

          <div>

            <div className="employees-eyebrow">
              👥 ADMIN WORKSPACE
            </div>

            <h1>
              HR Management
            </h1>

            <p>
              View registered HR users,
              inspect leave balances and
              manage HR accounts.
            </p>

          </div>


          <div className="employees-hero-actions">

            <button
              type="button"
              className="employees-btn employees-btn-secondary"
              onClick={fetchHRUsers}
              disabled={loading}
            >
              {loading
                ? "Refreshing..."
                : "↻ Refresh HR Users"}
            </button>


            <button
              type="button"
              className="employees-btn employees-btn-primary"
              onClick={exportPDF}
            >
              📄 Export PDF
            </button>


            <button
              type="button"
              className="employees-btn employees-btn-primary"
              onClick={exportExcel}
            >
              📊 Export Excel
            </button>


            <button
              type="button"
              className="employees-btn employees-btn-primary"
              onClick={() =>
                navigate(
                  "/admin-dashboard"
                )
              }
            >
              ← Back to Dashboard
            </button>

          </div>

        </section>


        {/* =================================================
            MESSAGES
        ================================================= */}

        {message && (
          <div className="employees-alert employees-alert-success">
            {message}
          </div>
        )}


        {error && (
          <div className="employees-alert employees-alert-error">
            {error}
          </div>
        )}


        {/* =================================================
            HR STATISTICS
        ================================================= */}

        <section className="employees-stats-grid">

          <article className="employees-stat-card">

            <div className="employees-stat-icon">
              👥
            </div>

            <div className="employees-stat-content">

              <span>
                Total HR Users
              </span>

              <strong>
                {hrUsers.length}
              </strong>

              <small>
                Registered HR accounts
              </small>

            </div>

          </article>


          <article className="employees-stat-card">

            <div className="employees-stat-icon">
              📄
            </div>

            <div className="employees-stat-content">

              <span>
                Leave Requests
              </span>

              <strong>
                {totals.requests}
              </strong>

              <small>
                HR leave applications
              </small>

            </div>

          </article>


          <article className="employees-stat-card">

            <div className="employees-stat-icon">
              ✓
            </div>

            <div className="employees-stat-content">

              <span>
                Approved Requests
              </span>

              <strong>
                {totals.approved}
              </strong>

              <small>
                Approved HR requests
              </small>

            </div>

          </article>


          <article className="employees-stat-card">

            <div className="employees-stat-icon">
              ⏳
            </div>

            <div className="employees-stat-content">

              <span>
                Pending Requests
              </span>

              <strong>
                {totals.pending}
              </strong>

              <small>
                Waiting for review
              </small>

            </div>

          </article>

        </section>


        {/* =================================================
            HR TABLE
        ================================================= */}

        <section className="employees-card">

          <div className="employees-card-header">

            <div>

              <h2>
                Registered HR Users
              </h2>

              <p>
                Search HR users, review
                balances and manage HR
                accounts.
              </p>

            </div>


            <div className="employees-search-box">

              <span>
                🔍
              </span>

              <input
                type="text"
                placeholder="Search HR name, email or department"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />


              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

            </div>

          </div>


          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (

            <div className="employees-state">

              <div className="employees-spinner" />

              <p>
                Loading HR users...
              </p>

            </div>

          ) : (

            <div className="employees-table-wrapper">

              <table className="employees-table">

                <thead>

                  <tr>

                    <th>
                      HR
                    </th>

                    <th>
                      Department
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Casual
                    </th>

                    <th>
                      Sick
                    </th>

                    <th>
                      Earned
                    </th>

                    <th>
                      Marriage
                    </th>

                    <th>
                      Requests
                    </th>

                    <th>
                      Approved
                    </th>

                    <th>
                      Pending
                    </th>

                    <th>
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredHR.map(
                    (user) => {

                      const balances =
                        getBalances(user);

                      const statistics =
                        getStatistics(user);


                      return (

                        <tr
                          key={user._id}
                        >

                          {/* HR */}

                          <td>

                            <div className="employees-user">

                              <div className="employees-avatar">

                                {getInitials(
                                  user.name
                                )}

                              </div>


                              <div className="employees-user-info">

                                <strong>
                                  {user.name ||
                                    "HR User"}
                                </strong>

                                <span>
                                  {user.email ||
                                    "-"}
                                </span>

                              </div>

                            </div>

                          </td>


                          {/* DEPARTMENT */}

                          <td>
                            {user.department ||
                              "-"}
                          </td>


                          {/* ROLE */}

                          <td>

                            <span className="employees-role">
                              HR
                            </span>

                          </td>


                          {/* CASUAL */}

                          <td>

                            <span className="employees-balance">
                              {balances.casual}
                            </span>

                          </td>


                          {/* SICK */}

                          <td>

                            <span className="employees-balance">
                              {balances.sick}
                            </span>

                          </td>


                          {/* EARNED */}

                          <td>

                            <span className="employees-balance">
                              {balances.earned}
                            </span>

                          </td>


                          {/* MARRIAGE */}

                          <td>

                            <span className="employees-balance">
                              {balances.marriage}
                            </span>

                          </td>


                          {/* REQUESTS */}

                          <td>
                            {statistics.total}
                          </td>


                          {/* APPROVED */}

                          <td>
                            {statistics.approved}
                          </td>


                          {/* PENDING */}

                          <td>
                            {statistics.pending}
                          </td>


                          {/* ACTIONS */}

                          <td>

                            <div className="employees-actions">


                              {/* VIEW DETAILS */}

                              <button
                                type="button"
                                className="employees-view-btn"
                                onClick={() =>
                                  navigate(
                                    `/admin/hr/${user._id}`
                                  )
                                }
                              >
                                👁 View Details
                              </button>


                              {/* EDIT PROFILE */}

                              <button
                                type="button"
                                className="employees-edit-btn"
                                onClick={() =>
                                  navigate(
                                    `/edit-employee/${user._id}`
                                  )
                                }
                              >
                                ✏ Edit Profile
                              </button>


                              {/* DELETE */}

                              <button
                                type="button"
                                className="employees-delete-btn"
                                onClick={() =>
                                  deleteHR(user)
                                }
                              >
                                🗑 Delete
                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )}


                  {/* NO USERS */}

                  {filteredHR.length === 0 && (

                    <tr>

                      <td
                        colSpan="11"
                        className="employees-empty"
                      >
                        {search
                          ? "No HR users found matching your search."
                          : "No HR users found."}
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

          )}


          {/* =================================================
              FOOTER
          ================================================= */}

          {!loading && (

            <div className="employees-footer">

              Showing{" "}

              <strong>
                {filteredHR.length}
              </strong>

              {" "}of{" "}

              <strong>
                {hrUsers.length}
              </strong>

              {" "}HR users

            </div>

          )}

        </section>

      </div>

    </div>
  );
}


export default HR;