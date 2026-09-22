import React, { useEffect, useState, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = sessionStorage.getItem("user");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };

    loadUser();
  }, []);

  const role = user?.role;

  const fetchUnreadCount = useCallback(async () => {
    if (role !== "admin") return;

    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data?.unread || 0);
    } catch (error) {
      console.error("Unable to load notification count:", error);
    }
  }, [role]);

  useEffect(() => {
    if (role === "admin") {
      fetchUnreadCount();

      const timer = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      window.addEventListener("focus", fetchUnreadCount);

      return () => {
        clearInterval(timer);
        window.removeEventListener("focus", fetchUnreadCount);
      };
    }
  }, [role, fetchUnreadCount]);

  const getRoleName = () => {
    switch (role) {
      case "admin":
        return "Admin";

      case "manager":
        return "Manager";

      case "departmentHead":
        return "Department Head";

      case "hr":
        return "HR";

      default:
        return "Employee";
    }
  };

  const getDashboardPath = () => {
    switch (role) {
      case "admin":
        return "/admin-dashboard";

      case "manager":
        return "/manager-dashboard";

      case "departmentHead":
        return "/department-head-dashboard";

      case "hr":
        return "/hr-dashboard";

      default:
        return "/dashboard";
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setUser(null);
    setIsMenuOpen(false);

    navigate("/");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const getInitials = () => {
    if (!user?.name) return "U";

    return user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LOGO */}
        <div
          className="navbar-brand"
          onClick={() => navigate(getDashboardPath())}
        >
          <div className="brand-logo">
            <span>LM</span>
          </div>

          <div className="brand-text">
            <h2>LeaveFlow</h2>
            <span>Leave Management System</span>
          </div>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className="navbar-menu-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>

        {/* NAVIGATION */}
        <div
          className={`navbar-menu ${
            isMenuOpen ? "navbar-menu-active" : ""
          }`}
        >

          {/* ADMIN */}
          {role === "admin" && (
            <>
              <NavLink
                to="/admin-dashboard"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">🏠</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/employees"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">👥</span>
                <span>Employees</span>
              </NavLink>

              <NavLink
                  to="/manage-leaves"
                  onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📋</span>
                <span>Manage Leaves</span>
              </NavLink>

              <NavLink
                to="/notifications"
                onClick={() => {
                  closeMenu();
                  fetchUnreadCount();
                }}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon notification-icon-container">
                  🔔
                  {unreadCount > 0 && (
                    <span className="notification-badge">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                <span>Notifications</span>
              </NavLink>

              <NavLink
                to="/reports"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📊</span>
                <span>Reports</span>
              </NavLink>
            </>
          )}

          {/* MANAGER */}
          {role === "manager" && (
            <>
              <NavLink
                to="/manager-dashboard"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">🏠</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/manager/leave-requests"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📋</span>
                <span>Leave Requests</span>
              </NavLink>

              <NavLink
                to="/manager-team"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">👥</span>
                <span>Team Members</span>
              </NavLink>

              <NavLink
                to="/apply-leave"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📝</span>
                <span>Apply Leave</span>
              </NavLink>

              <NavLink
                to="/leave-history"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📅</span>
                <span>Leave History</span>
              </NavLink>
            </>
          )}

          {/* DEPARTMENT HEAD */}
          {role === "departmentHead" && (
            <>
              <NavLink
                to="/department-head-dashboard"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">🏠</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
               to="/department-head/leave-requests"                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📋</span>
                <span>Department Leaves</span>
              </NavLink>

              <NavLink
                to="/apply-leave"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📝</span>
                <span>Apply Leave</span>
              </NavLink>

              <NavLink
                to="/leave-history"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📅</span>
                <span>Leave History</span>
              </NavLink>
            </>
          )}

          {/* HR */}
          {role === "hr" && (
            <>
              <NavLink
                to="/hr-dashboard"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">🏠</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                 to="/hr/leave-requests"
                  onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📋</span>
                <span>Leave Verification</span>
              </NavLink>

              <NavLink
                to="/apply-leave"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📝</span>
                <span>Apply Leave</span>
              </NavLink>

              <NavLink
                to="/leave-history"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📅</span>
                <span>Leave History</span>
              </NavLink>
            </>
          )}

          {/* EMPLOYEE */}
          {role === "employee" && (
            <>
              <NavLink
                to="/dashboard"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">🏠</span>
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/apply-leave"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📝</span>
                <span>Apply Leave</span>
              </NavLink>

              <NavLink
                to="/leave-history"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                <span className="nav-icon">📅</span>
                <span>Leave History</span>
              </NavLink>
            </>
          )}

          {/* USER SECTION */}
          <div className="navbar-user">

            <div className="navbar-user-info">
              <strong>
                {user?.name || getRoleName()}
              </strong>

              <span>
                {getRoleName()}
              </span>
            </div>

            <div className="navbar-avatar">
              {getInitials()}
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              <span>↪</span>
              <span>Logout</span>
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
