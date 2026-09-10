import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /* ===========================================
     GET USER
  =========================================== */

  const storedUser = localStorage.getItem("user");

  const user = storedUser ? JSON.parse(storedUser) : null;

  /* ===========================================
     ROLES
  =========================================== */

  const isAdmin = user?.role === "admin";
  const isEmployee = user?.role === "employee";
  const isManager = user?.role === "manager";
  const isDepartmentHead = user?.role === "departmentHead";
  const isHR = user?.role === "hr";

  /* ===========================================
     ADMIN NOTIFICATIONS
  =========================================== */

  const fetchUnreadCount = async () => {
    if (!isAdmin) return;

    try {
      const token = localStorage.getItem("token");

      const { data } = await api.get(
        "/notifications/unread-count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUnreadCount(data.unread || 0);
    } catch (error) {
      console.error(
        "Unable to load notification count",
        error
      );
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const timer = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  /* ===========================================
     NO USER
  =========================================== */

  if (!user) {
    return null;
  }

  /* ===========================================
     USER INITIALS
  =========================================== */

  const getInitials = () => {
    if (!user.name) return "U";

    const words = user.name.trim().split(" ");

    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }

    return (
      words[0][0] +
      words[words.length - 1][0]
    ).toUpperCase();
  };

  /* ===========================================
     HELPERS
  =========================================== */

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/", {
      replace: true,
    });
  };

  return (
    <nav className="app-navbar">

      {/* ==========================
          LOGO
      ========================== */}

      <div
        className="navbar-brand"
        onClick={() => {
          closeMenu();

          if (isAdmin) {
            navigate("/admin-dashboard");
          } else if (isManager) {
            navigate("/manager-dashboard");
          } else if (isDepartmentHead) {
            navigate("/department-head-dashboard");
          } else if (isHR) {
            navigate("/hr-dashboard");
          } else {
            navigate("/dashboard");
          }
        }}
      >
        <div className="navbar-logo">
          LM
        </div>

        <div className="navbar-brand-text">
          <h1 className="navbar-title">
            LeaveFlow
          </h1>

          <span className="navbar-subtitle">
            Leave Management System
          </span>
        </div>
      </div>

      {/* ==========================
          NAVIGATION LINKS
      ========================== */}

      <div
        className={
          menuOpen
            ? "navbar-links open"
            : "navbar-links"
        }
      >
                {/* ==========================
            ADMIN MENU
        ========================== */}

        {isAdmin ? (

          <>
            <NavLink
              to="/admin-dashboard"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">🏠</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/manage-leaves"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">📋</span>
              Manage Leaves
            </NavLink>

            <NavLink
              to="/employees"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >

              <NavLink
  to="/departments"
  onClick={closeMenu}
  className={({ isActive }) =>
    isActive
      ? "navbar-link active"
      : "navbar-link"
  }
>
  <span className="navbar-link-icon">🏢</span>
  Departments
</NavLink>
              <span className="navbar-link-icon">👥</span>
              Employees
            </NavLink>

            <NavLink
              to="/notifications"
              onClick={() => {
                closeMenu();
                fetchUnreadCount();
              }}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span
                className="navbar-link-icon"
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🔔

                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </span>

              Notifications
            </NavLink>

            <NavLink
              to="/reports"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">📊</span>
              Reports
            </NavLink>

          </>
                  ) : isManager ? (

          <>
            <NavLink
              to="/manager-dashboard"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">🏠</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/manager/leave-requests"             
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">📋</span>
              Leave Requests
            </NavLink>

            <NavLink
              to="/manager-team"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">👥</span>
              Team Members
            </NavLink>

          </>

        ) : isDepartmentHead ? (

          <>
            <NavLink
              to="/department-head-dashboard"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">🏠</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/department-head/leave-requests"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">📋</span>
              Department Leaves
            </NavLink>

          </>

        ) : isHR ? (

          <>
            <NavLink
              to="/hr-dashboard"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">🏠</span>
              Dashboard
            </NavLink>

            <NavLink
             to="/hr/leave-requests"             
             onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">📋</span>
              Leave Verification
            </NavLink>

          </>

        ) : isEmployee ? (

          <>
            <NavLink
              to="/dashboard"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">🏠</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/apply-leave"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">📝</span>
              Apply Leave
            </NavLink>

            <NavLink
              to="/leave-history"
              onClick={closeMenu}
              className={({ isActive }) =>
                isActive
                  ? "navbar-link active"
                  : "navbar-link"
              }
            >
              <span className="navbar-link-icon">📅</span>
              Leave History
            </NavLink>
          </>

        ) : null}

      </div>
            {/* ==========================
          USER SECTION
      ========================== */}

      <div className="navbar-user-section">

        <div className="navbar-user-info">

          <span className="navbar-user-name">
            {user.name}
          </span>

          <span className="navbar-user-role">
            {isAdmin
              ? "Administrator"
              : isManager
              ? "Manager"
              : isDepartmentHead
              ? "Department Head"
              : isHR
              ? "HR"
              : "Employee"}
          </span>

        </div>

        <div
          className="navbar-avatar"
          title={user.name}
        >
          {getInitials()}
        </div>

        <button
          className="navbar-logout-btn"
          onClick={handleLogout}
        >
          <span>↪</span>

          <span className="navbar-logout-text">
            Logout
          </span>
        </button>

        <button
          className="navbar-menu-btn"
          onClick={() =>
            setMenuOpen(!menuOpen)
          }
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>

    </nav>
  );
}

export default Navbar;