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


function DepartmentHeads() {

  const navigate = useNavigate();


  // =========================================================
  // STATE
  // =========================================================

  const [departmentHeads, setDepartmentHeads] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  // =========================================================
  // AUTH CONFIG
  // Same authentication method used by Managers.js
  // =========================================================

  const getAuthConfig = () => {

    const token =
      sessionStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

  };


  // =========================================================
  // UNAUTHORIZED
  // =========================================================

  const handleUnauthorized =
    useCallback(() => {

      sessionStorage.removeItem("token");

      sessionStorage.removeItem("user");

      navigate("/", {
        replace: true,
      });

    }, [navigate]);


  // =========================================================
  // FETCH DEPARTMENT HEADS
  // =========================================================

  const fetchDepartmentHeads =
    useCallback(async () => {

      try {

        setLoading(true);

        setError("");

        setMessage("");


        const token =
          sessionStorage.getItem("token");


        if (!token) {

          handleUnauthorized();

          return;

        }


        const response = await api.get(
          "/users",
          getAuthConfig()
        );


        const users =
          Array.isArray(response.data)
            ? response.data
            : Array.isArray(
                response.data?.users
              )
            ? response.data.users
            : [];


        // Only Department Head users

        const heads =
          users.filter(
            (user) =>
              user.role ===
              "departmentHead"
          );


        setDepartmentHeads(heads);


      } catch (error) {

        console.error(
          "FETCH DEPARTMENT HEADS ERROR:",
          error
        );


        if (
          error.response?.status === 401
        ) {

          handleUnauthorized();

          return;

        }


        if (
          error.response?.status === 403
        ) {

          setError(
            "Access denied. Admin account is required."
          );

          return;

        }


        setError(
          error.response?.data?.message ||
          "Unable to load Department Heads."
        );


      } finally {

        setLoading(false);

      }

    }, [handleUnauthorized]);


  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {

    fetchDepartmentHeads();

  }, [fetchDepartmentHeads]);


  // =========================================================
  // SEARCH
  // =========================================================

  const filteredDepartmentHeads =
    useMemo(() => {

      const searchText =
        search.trim().toLowerCase();


      if (!searchText) {

        return departmentHeads;

      }


      return departmentHeads.filter(
        (head) => {

          const name =
            head.name
              ?.toLowerCase() || "";

          const email =
            head.email
              ?.toLowerCase() || "";

          const department =
            head.department
              ?.toLowerCase() || "";


          return (
            name.includes(searchText) ||
            email.includes(searchText) ||
            department.includes(searchText)
          );

        }
      );

    }, [departmentHeads, search]);


  // =========================================================
  // LEAVE BALANCES
  // =========================================================

  const getBalances = (head) => {

    const balances =
      head?.leaveBalance ||
      head?.leaveBalances ||
      {};


    return {

      casual:
        Number(
          balances.casual ?? 0
        ),

      sick:
        Number(
          balances.sick ?? 0
        ),

      earned:
        Number(
          balances.earned ?? 0
        ),

      marriage:
        Number(
          balances.marriage ?? 0
        ),

      maternity:
        Number(
          balances.maternity ?? 0
        ),

      paternity:
        Number(
          balances.paternity ?? 0
        ),

      bereavement:
        Number(
          balances.bereavement ?? 0
        ),

    };

  };


  // =========================================================
  // INITIALS
  // =========================================================

  const getInitials = (name) => {

    if (!name) {

      return "D";

    }


    const words =
      name.trim().split(/\s+/);


    if (words.length === 1) {

      return words[0]
        .charAt(0)
        .toUpperCase();

    }


    return (

      words[0]
        .charAt(0)
        .toUpperCase() +

      words[words.length - 1]
        .charAt(0)
        .toUpperCase()

    );

  };


  // =========================================================
  // DELETE DEPARTMENT HEAD
  // =========================================================

  const deleteDepartmentHead =
    async (head) => {

      if (!head?._id) {

        setError(
          "Department Head ID is missing."
        );

        return;

      }


      const confirmed =
        window.confirm(
          `Are you sure you want to delete ${head.name}?`
        );


      if (!confirmed) {

        return;

      }


      try {

        setError("");

        setMessage("");


        const response =
          await api.delete(
            `/users/${head._id}`,
            getAuthConfig()
          );


        setDepartmentHeads(
          (current) =>
            current.filter(
              (item) =>
                item._id !== head._id
            )
        );


        setMessage(
          response.data?.message ||
          "Department Head deleted successfully."
        );


      } catch (error) {

        console.error(
          "DELETE DEPARTMENT HEAD ERROR:",
          error
        );


        if (
          error.response?.status === 401
        ) {

          handleUnauthorized();

          return;

        }


        setError(
          error.response?.data?.message ||
          "Unable to delete Department Head."
        );

      }

    };


  // =========================================================
  // PDF EXPORT
  // =========================================================

  const exportPDF = () => {

    const doc = new jsPDF();


    doc.setFontSize(18);

    doc.text(
      "Department Head Report",
      14,
      20
    );


    const rows =
      departmentHeads.map(
        (head) => {

          const balances =
            getBalances(head);


          return [

            head.name || "-",

            head.email || "-",

            head.department || "-",

            balances.casual,

            balances.sick,

            balances.earned,

            balances.marriage,

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
      ]],

      body: rows,

    });


    doc.save(
      "Department_Heads_Report.pdf"
    );

  };


  // =========================================================
  // EXCEL EXPORT
  // =========================================================

  const exportExcel = () => {

    const rows =
      departmentHeads.map(
        (head) => {

          const balances =
            getBalances(head);


          return {

            Name:
              head.name || "-",

            Email:
              head.email || "-",

            Department:
              head.department || "-",

            Role:
              "Department Head",

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

          };

        }
      );


    const worksheet =
      XLSX.utils.json_to_sheet(
        rows
      );


    const workbook =
      XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Department Heads"
    );


    const excelBuffer =
      XLSX.write(
        workbook,
        {
          bookType: "xlsx",
          type: "array",
        }
      );


    const file =
      new Blob(
        [excelBuffer],
        {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        }
      );


    saveAs(
      file,
      "Department_Heads_Report.xlsx"
    );

  };


  // =========================================================
  // PAGE
  // =========================================================

  return (

    <div className="employees-page">

      <div className="employees-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <section className="employees-hero">

          <div>

            <div className="employees-eyebrow">

              ADMIN WORKSPACE

            </div>


            <h1>

              Department Head Management

            </h1>


            <p>

              View and manage all
              Department Head accounts.

            </p>

          </div>


          <div className="employees-hero-actions">


            <button
              type="button"
              className="employees-btn employees-btn-secondary"
              onClick={
                fetchDepartmentHeads
              }
              disabled={loading}
            >

              {loading
                ? "Refreshing..."
                : "Refresh"}

            </button>


            <button
              type="button"
              className="employees-btn employees-btn-primary"
              onClick={exportPDF}
            >

              Export PDF

            </button>


            <button
              type="button"
              className="employees-btn employees-btn-primary"
              onClick={exportExcel}
            >

              Export Excel

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

              Back

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
            STATISTICS
        ================================================= */}

        <section className="employees-stats-grid">


          <article className="employees-stat-card">

            <div className="employees-stat-icon">

              👥

            </div>


            <div className="employees-stat-content">

              <span>

                Total Department Heads

              </span>


              <strong>

                {departmentHeads.length}

              </strong>


              <small>

                Registered Department Heads

              </small>

            </div>

          </article>


          <article className="employees-stat-card">

            <div className="employees-stat-icon">

              👨‍🏫

            </div>


            <div className="employees-stat-content">

              <span>

                Department Head Role

              </span>


              <strong>

                {departmentHeads.length}

              </strong>


              <small>

                Active accounts

              </small>

            </div>

          </article>


        </section>


        {/* =================================================
            TABLE CARD
        ================================================= */}

        <section className="employees-card">


          <div className="employees-card-header">


            <div>

              <h2>

                Registered Department Heads

              </h2>


              <p>

                Search and manage Department
                Head profiles.

              </p>

            </div>


            <div className="employees-search-box">

              <span>

                🔍

              </span>


              <input
                type="text"
                placeholder="Search name, email or department"
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

                Loading Department Heads...

              </p>

            </div>

          ) : (


            <div className="employees-table-wrapper">


              <table className="employees-table">


                <thead>

                  <tr>

                    <th>
                      Department Head
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
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>


                  {filteredDepartmentHeads.map(
                    (head) => {

                      const balances =
                        getBalances(head);


                      return (

                        <tr
                          key={
                            head._id
                          }
                        >


                          {/* USER */}

                          <td>

                            <div className="employees-user">


                              <div className="employees-avatar">

                                {getInitials(
                                  head.name
                                )}

                              </div>


                              <div className="employees-user-info">

                                <strong>

                                  {
                                    head.name ||
                                    "Department Head"
                                  }

                                </strong>


                                <span>

                                  {
                                    head.email ||
                                    "-"
                                  }

                                </span>

                              </div>


                            </div>

                          </td>


                          {/* DEPARTMENT */}

                          <td>

                            {
                              head.department ||
                              "-"
                            }

                          </td>


                          {/* ROLE */}

                          <td>

                            <span className="employees-role">

                              Department Head

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


                          {/* ACTIONS */}

                          <td>

                            <div className="employees-actions">


                              {/* VIEW DETAILS */}

                              <button
                                type="button"
                                className="employees-view-btn"
                                onClick={() =>
                                  navigate(
                                    `/admin/department-heads/${head._id}`
                                  )
                                }
                              >

                                View Details

                              </button>


                              {/* EDIT PROFILE */}

                              <button
                                type="button"
                                className="employees-edit-btn"
                                onClick={() =>
                                  navigate(
                                    `/edit-employee/${head._id}`
                                  )
                                }
                              >

                                Edit Profile

                              </button>


                              {/* DELETE */}

                              <button
                                type="button"
                                className="employees-delete-btn"
                                onClick={() =>
                                  deleteDepartmentHead(
                                    head
                                  )
                                }
                              >

                                Delete

                              </button>


                            </div>

                          </td>


                        </tr>

                      );

                    }
                  )}


                  {/* NO DATA */}

                  {filteredDepartmentHeads.length ===
                    0 && (

                    <tr>

                      <td
                        colSpan="8"
                        className="employees-empty"
                      >

                        {search
                          ? "No Department Heads match your search."
                          : "No Department Heads found."}

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

                {
                  filteredDepartmentHeads.length
                }

              </strong>

              {" "}of{" "}

              <strong>

                {departmentHeads.length}

              </strong>

              {" "}Department Heads

            </div>

          )}


        </section>

      </div>

    </div>

  );

}


export default DepartmentHeads;