import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";

import "./EmployeeDetails.css";


function DepartmentHeadDetails() {

  const navigate = useNavigate();

  const { id } = useParams();


  // =========================================================
  // STATES
  // =========================================================

  const [departmentHead, setDepartmentHead] =
    useState(null);

  const [leaves, setLeaves] =
    useState([]);

  const [statistics, setStatistics] =
    useState({
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    });

  const [leaveUsage, setLeaveUsage] =
    useState({
      approvedTotalDays: 0,
      approvedPaidDays: 0,
      approvedUnpaidDays: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =========================================================
  // AUTH CONFIG
  // Supports the same token storage used in your project
  // =========================================================

  const getAuthConfig = () => {

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");


    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

  };


  // =========================================================
  // FETCH DEPARTMENT HEAD + LEAVES
  // =========================================================

  const fetchDepartmentHead =
    useCallback(async () => {

      try {

        setLoading(true);

        setError("");


        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");


        if (!token) {

          navigate("/", {
            replace: true,
          });

          return;

        }


        // ===================================================
        // GET ALL USERS
        // ===================================================

        const usersResponse =
          await api.get(
            "/users",
            getAuthConfig()
          );


        const users =
          Array.isArray(
            usersResponse.data
          )
            ? usersResponse.data
            : Array.isArray(
                usersResponse.data?.users
              )
            ? usersResponse.data.users
            : [];


        // Find selected Department Head

        const selectedHead =
          users.find(
            (user) =>
              String(user._id) ===
              String(id)
          );


        if (
          !selectedHead ||
          selectedHead.role !==
            "departmentHead"
        ) {

          setError(
            "The selected account is not a Department Head."
          );

          return;

        }


        setDepartmentHead(
          selectedHead
        );


        // ===================================================
        // GET ALL LEAVES
        // ===================================================

        const leavesResponse =
          await api.get(
            "/leaves",
            getAuthConfig()
          );


        const allLeaves =
          Array.isArray(
            leavesResponse.data
          )
            ? leavesResponse.data
            : Array.isArray(
                leavesResponse.data?.leaves
              )
            ? leavesResponse.data.leaves
            : [];


        // ===================================================
        // FILTER LEAVES FOR THIS DEPARTMENT HEAD
        // ===================================================

        const departmentHeadLeaves =
          allLeaves.filter(
            (leave) => {

              const employee =
                leave?.employee;


              const employeeId =
                employee?._id ||
                employee;


              return (
                String(employeeId) ===
                String(selectedHead._id)
              );

            }
          );


        setLeaves(
          departmentHeadLeaves
        );


        // ===================================================
        // STATISTICS
        // ===================================================

        let total = 0;

        let approved = 0;

        let pending = 0;

        let rejected = 0;


        departmentHeadLeaves.forEach(
          (leave) => {

            total += 1;


            const status =
              String(
                leave?.status || ""
              ).toLowerCase();


            if (
              status === "approved"
            ) {

              approved += 1;

            }


            if (
              status === "pending"
            ) {

              pending += 1;

            }


            if (
              status === "rejected"
            ) {

              rejected += 1;

            }

          }
        );


        setStatistics({
          total,
          approved,
          pending,
          rejected,
        });


        // ===================================================
        // APPROVED LEAVE USAGE
        // ===================================================

        let approvedTotalDays = 0;

        let approvedPaidDays = 0;

        let approvedUnpaidDays = 0;


        departmentHeadLeaves.forEach(
          (leave) => {

            const status =
              String(
                leave?.status || ""
              ).toLowerCase();


            if (
              status === "approved"
            ) {

              approvedTotalDays +=
                Number(
                  leave?.totalDays
                ) || 0;


              approvedPaidDays +=
                Number(
                  leave?.paidDays
                ) || 0;


              approvedUnpaidDays +=
                Number(
                  leave?.unpaidDays
                ) || 0;

            }

          }
        );


        setLeaveUsage({

          approvedTotalDays,

          approvedPaidDays,

          approvedUnpaidDays,

        });


      } catch (err) {

        console.error(
          "DEPARTMENT HEAD DETAILS ERROR:",
          err
        );


        if (
          err.response?.status === 401
        ) {

          localStorage.removeItem(
            "token"
          );

          sessionStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "user"
          );

          sessionStorage.removeItem(
            "user"
          );


          navigate("/", {
            replace: true,
          });

          return;

        }


        setError(
          err.response?.data?.message ||
          "Unable to load Department Head details."
        );


      } finally {

        setLoading(false);

      }

    }, [id, navigate]);


  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {

    fetchDepartmentHead();

  }, [fetchDepartmentHead]);


  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {

    if (!date) {

      return "-";

    }


    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  // =========================================================
  // BALANCES
  // =========================================================

  const balances =
    departmentHead?.leaveBalance ||
    departmentHead?.leaveBalances ||
    {};


  // =========================================================
  // INITIALS
  // =========================================================

  const departmentHeadInitials =
    useMemo(() => {

      if (
        !departmentHead?.name
      ) {

        return "D";

      }


      const words =
        departmentHead.name
          .trim()
          .split(/\s+/);


      if (
        words.length === 1
      ) {

        return words[0][0]
          .toUpperCase();

      }


      return (

        words[0][0] +
        words[
          words.length - 1
        ][0]

      ).toUpperCase();

    }, [departmentHead]);


  // =========================================================
  // LEAVE BALANCE CARDS
  // =========================================================

  const leaveCards = [

    {
      title: "Casual Leave",
      value:
        balances.casual ?? 0,
      icon: "🏖️",
      color: "#3b82f6",
    },

    {
      title: "Sick Leave",
      value:
        balances.sick ?? 0,
      icon: "🤒",
      color: "#ef4444",
    },

    {
      title: "Earned Leave",
      value:
        balances.earned ?? 0,
      icon: "💼",
      color: "#22c55e",
    },

    {
      title: "Marriage Leave",
      value:
        balances.marriage ?? 0,
      icon: "💍",
      color: "#ec4899",
    },

    {
      title: "Maternity",
      value:
        balances.maternity ?? 0,
      icon: "🤱",
      color: "#8b5cf6",
    },

    {
      title: "Paternity",
      value:
        balances.paternity ?? 0,
      icon: "👨‍👦",
      color: "#f97316",
    },

    {
      title: "Bereavement",
      value:
        balances.bereavement ?? 0,
      icon: "🕊️",
      color: "#64748b",
    },

    {
      title: "Leave Without Pay",
      value:
        balances.unpaid ?? 0,
      icon: "📄",
      color: "#0f766e",
    },

  ];


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="employee-details-loading">

        <div className="employee-loader"></div>

        <h2>
          Loading Department Head Details...
        </h2>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {

    return (

      <div className="employee-details-error">

        <h2>
          Unable to Load Department Head
        </h2>

        <p>
          {error}
        </p>


        <button
          onClick={() =>
            navigate(
              "/admin/department-heads"
            )
          }
        >
          Back to Department Heads
        </button>

      </div>

    );

  }


  // =========================================================
  // NOT FOUND
  // =========================================================

  if (!departmentHead) {

    return (

      <div className="employee-details-error">

        <h2>
          Department Head Not Found
        </h2>


        <button
          onClick={() =>
            navigate(
              "/admin/department-heads"
            )
          }
        >
          Back to Department Heads
        </button>

      </div>

    );

  }


  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (

    <div className="employee-details-page">


      {/* BACKGROUND */}

      <div className="employee-bg-circle employee-bg-circle1"></div>

      <div className="employee-bg-circle employee-bg-circle2"></div>


      <div className="employee-details-container">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="employee-profile-card">


          <button
            className="employee-back-btn"
            onClick={() =>
              navigate(
                "/admin/department-heads"
              )
            }
          >
            ← Back to Department Heads
          </button>


          <div className="employee-profile-content">


            {/* AVATAR */}

            <div className="employee-avatar">

              {departmentHeadInitials}

            </div>


            {/* DETAILS */}

            <div className="employee-profile-info">

              <h1>
                {departmentHead.name}
              </h1>


              <p>
                {departmentHead.email}
              </p>


              <div className="employee-role-badge">

                Department Head

              </div>

            </div>


            {/* JOINED */}

            <div className="employee-joined">

              <span>
                Joined On
              </span>


              <strong>
                {formatDate(
                  departmentHead.createdAt
                )}
              </strong>

            </div>

          </div>

        </div>


        {/* =================================================
            DEPARTMENT HEAD INFORMATION
        ================================================= */}

        <section className="employee-section">


          <h2>
            Department Head Information
          </h2>


          <div className="employee-info-grid">


            <div className="employee-info-card">

              <span>
                Name
              </span>

              <h3>
                {departmentHead.name}
              </h3>

            </div>


            <div className="employee-info-card">

              <span>
                Email
              </span>

              <h3>
                {departmentHead.email}
              </h3>

            </div>


            <div className="employee-info-card">

              <span>
                Role
              </span>

              <h3>
                Department Head
              </h3>

            </div>


            <div className="employee-info-card">

              <span>
                Department Head ID
              </span>

              <h3>
                {departmentHead._id
                  ?.slice(-8)
                  .toUpperCase()}
              </h3>

            </div>


            <div className="employee-info-card">

              <span>
                Department
              </span>

              <h3>
                {
                  departmentHead.department ||
                  "General"
                }
              </h3>

            </div>


            <div className="employee-info-card">

              <span>
                Phone
              </span>

              <h3>
                {
                  departmentHead.phone ||
                  "Not Available"
                }
              </h3>

            </div>


            <div className="employee-info-card">

              <span>
                Gender
              </span>

              <h3>
                {
                  departmentHead.gender ||
                  "Not Specified"
                }
              </h3>

            </div>


            <div className="employee-info-card">

              <span>
                Status
              </span>

              <h3 className="employee-active">

                Active

              </h3>

            </div>


          </div>

        </section>


        {/* =================================================
            LEAVE STATISTICS
        ================================================= */}

        <section className="employee-section">


          <h2>
            Leave Statistics
          </h2>


          <div className="employee-stats-grid">


            <div className="employee-stat-card total">

              <h3>
                Total Requests
              </h3>

              <h1>
                {statistics.total}
              </h1>

            </div>


            <div className="employee-stat-card approved">

              <h3>
                Approved
              </h3>

              <h1>
                {statistics.approved}
              </h1>

            </div>


            <div className="employee-stat-card pending">

              <h3>
                Pending
              </h3>

              <h1>
                {statistics.pending}
              </h1>

            </div>


            <div className="employee-stat-card rejected">

              <h3>
                Rejected
              </h3>

              <h1>
                {statistics.rejected}
              </h1>

            </div>


          </div>

        </section>


        {/* =================================================
            AVAILABLE LEAVE BALANCE
        ================================================= */}

        <section className="employee-section">


          <h2>
            Available Leave Balance
          </h2>


          <div className="employee-balance-grid">


            {leaveCards.map(
              (leave) => (

                <div
                  key={
                    leave.title
                  }
                  className="employee-balance-card"
                >


                  <div
                    className="employee-balance-icon"
                    style={{
                      background:
                        leave.color,
                    }}
                  >

                    {leave.icon}

                  </div>


                  <h3>
                    {leave.title}
                  </h3>


                  <h1>
                    {leave.value}
                  </h1>


                  <span>
                    Days Remaining
                  </span>


                </div>

              )
            )}


          </div>

        </section>


        {/* =================================================
            APPROVED LEAVE USAGE
        ================================================= */}

        <section className="employee-section">


          <h2>
            Approved Leave Usage
          </h2>


          <div className="employee-usage-grid">


            <div className="employee-usage-card">

              <h3>
                Total Approved Days
              </h3>

              <h1>
                {
                  leaveUsage.approvedTotalDays
                }
              </h1>


              <div className="usage-progress">

                <div
                  className="usage-fill usage-blue"
                  style={{
                    width: `${Math.min(
                      leaveUsage.approvedTotalDays,
                      100
                    )}%`,
                  }}
                ></div>

              </div>

            </div>


            <div className="employee-usage-card">

              <h3>
                Paid Leave Used
              </h3>

              <h1>
                {
                  leaveUsage.approvedPaidDays
                }
              </h1>


              <div className="usage-progress">

                <div
                  className="usage-fill usage-green"
                  style={{
                    width: `${Math.min(
                      leaveUsage.approvedPaidDays,
                      100
                    )}%`,
                  }}
                ></div>

              </div>

            </div>


            <div className="employee-usage-card">

              <h3>
                Unpaid Leave Used
              </h3>

              <h1>
                {
                  leaveUsage.approvedUnpaidDays
                }
              </h1>


              <div className="usage-progress">

                <div
                  className="usage-fill usage-red"
                  style={{
                    width: `${Math.min(
                      leaveUsage.approvedUnpaidDays,
                      100
                    )}%`,
                  }}
                ></div>

              </div>

            </div>


          </div>

        </section>


        {/* =================================================
            PERFORMANCE SUMMARY
        ================================================= */}

        <section className="employee-section">


          <h2>
            Performance Summary
          </h2>


          <div className="employee-summary-grid">


            <div className="summary-card">

              <span>
                Total Leave Requests
              </span>

              <h2>
                {statistics.total}
              </h2>

            </div>


            <div className="summary-card">

              <span>
                Approval Rate
              </span>


              <h2>

                {statistics.total === 0
                  ? 0
                  : Math.round(
                      (
                        statistics.approved /
                        statistics.total
                      ) * 100
                    )}

                %

              </h2>

            </div>


            <div className="summary-card">

              <span>
                Pending Requests
              </span>

              <h2>
                {statistics.pending}
              </h2>

            </div>


            <div className="summary-card">

              <span>
                Rejected Requests
              </span>

              <h2>
                {statistics.rejected}
              </h2>

            </div>


          </div>

        </section>


        {/* =================================================
            LEAVE HISTORY
        ================================================= */}

        <section className="employee-section">


          <div className="section-header">

            <h2>
              Leave History
            </h2>

          </div>


          {leaves.length === 0 ? (

            <div className="employee-empty">

              <h3>
                No Leave History Found
              </h3>

              <p>
                This Department Head has
                not applied for any leave yet.
              </p>

            </div>

          ) : (

            <div className="employee-table-wrapper">


              <table className="employee-table">


                <thead>

                  <tr>

                    <th>
                      Leave Type
                    </th>

                    <th>
                      Start Date
                    </th>

                    <th>
                      End Date
                    </th>

                    <th>
                      Total Days
                    </th>

                    <th>
                      Paid
                    </th>

                    <th>
                      Unpaid
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>

                </thead>


                <tbody>


                  {leaves.map(
                    (leave) => (

                      <tr
                        key={
                          leave._id
                        }
                      >

                        <td>
                          {
                            leave.leaveType ||
                            "-"
                          }
                        </td>


                        <td>
                          {
                            formatDate(
                              leave.startDate
                            )
                          }
                        </td>


                        <td>
                          {
                            formatDate(
                              leave.endDate
                            )
                          }
                        </td>


                        <td>
                          {
                            leave.totalDays ??
                            0
                          }
                        </td>


                        <td>
                          {
                            leave.paidDays ??
                            0
                          }
                        </td>


                        <td>
                          {
                            leave.unpaidDays ??
                            0
                          }
                        </td>


                        <td>

                          <span
                            className={`status-badge ${
                              String(
                                leave.status ||
                                ""
                              ).toLowerCase()
                            }`}
                          >

                            {
                              leave.status ||
                              "-"
                            }

                          </span>

                        </td>


                      </tr>

                    )
                  )}


                </tbody>

              </table>


            </div>

          )}


        </section>


      </div>

    </div>

  );

}


export default DepartmentHeadDetails;