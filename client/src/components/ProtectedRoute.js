import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRole }) {
  // Get token and user from this browser tab's session storage.
  const token = sessionStorage.getItem("token");
  const storedUser = sessionStorage.getItem("user");

  let user = null;

  // Convert stored user JSON string into JavaScript object
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    // Invalid user data: clear this tab's session.
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    return <Navigate to="/" replace />;
  }

  // ==========================================
  // Check 1: User is not logged in
  // ==========================================
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // ==========================================
  // Check 2: User role is not allowed
  // ==========================================
  if (allowedRole && user.role !== allowedRole) {
    // If logged-in user is admin,
    // redirect to Admin Dashboard
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }

    // Otherwise redirect employee
    // to Employee Dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // ==========================================
  // User is logged in and has correct role
  // ==========================================
  return children;
}

export default ProtectedRoute;
