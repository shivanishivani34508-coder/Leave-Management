import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./App.css";

import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import ApplyLeave from "./pages/ApplyLeave";
import LeaveHistory from "./pages/LeaveHistory";

import AdminDashboard from "./pages/AdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerTeam from "./pages/ManagerTeam";
import ManageLeaves from "./pages/ManageLeaves";
import Employees from "./pages/Employees";
import EmployeeDetails from "./pages/EmployeeDetails";
import AddEmployee from "./pages/AddEmployee";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import HolidayManagement from "./pages/HolidayManagement";
import Holidays from "./pages/Holidays";
import HolidayCalendar from "./pages/HolidayCalendar";
import Managers from "./pages/Managers";
import DepartmentHeads from "./pages/DepartmentHeads";
import HR from "./pages/HR";
import HRDashboard from "./pages/HRDashboard";
import ManagerLeaveRequests from "./pages/ManagerLeaveRequests";
import DepartmentHeadDashboard from "./pages/DepartmentHeadDashboard";
import DepartmentHeadLeaveRequests from "./pages/DepartmentHeadLeaveRequests";
import HRLeaveRequests from "./pages/HRLeaveRequests";
import Departments from "./pages/Departments";
import EditEmployee from "./pages/EditEmployee";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import YearlyLeaveBalances from "./pages/YearlyLeaveBalances";


/* =========================================================
   GET USER FROM LOCAL STORAGE
========================================================= */

function getStoredUser() {
  try {
    const storedUser = sessionStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error("INVALID STORED USER:", error);

    sessionStorage.removeItem("user");

    return null;
  }
}


/* =========================================================
   PUBLIC ROUTE
========================================================= */

function PublicRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const user = getStoredUser();

  if (token && user) {

    if (user.role === "admin") {
      return (
        <Navigate
          to="/admin-dashboard"
          replace
        />
      );
    }

    if (user.role === "employee") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

  }

  return children;
}


/* =========================================================
   EMPLOYEE ROUTE
========================================================= */

function EmployeeRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (user.role === "employee") {
    return children;
  }

  if (user.role === "admin") {
    return (
      <Navigate
        to="/admin-dashboard"
        replace
      />
    );
  }

  if (user.role === "manager") {
    return (
      <Navigate
        to="/manager-dashboard"
        replace
      />
    );
  }

  if (user.role === "departmentHead") {
    return (
      <Navigate
        to="/department-head-dashboard"
        replace
      />
    );
  }

  if (user.role === "hr") {
    return (
      <Navigate
        to="/hr-dashboard"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/"
      replace
    />
  );
}


/* =========================================================
   ADMIN ROUTE
========================================================= */

function AdminRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const user = getStoredUser();

  console.log("AdminRoute:", {
    token: !!token,
    role: user?.role,
  });

  if (!token || !user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (user.role === "admin") {
    return children;
  }

  if (user.role === "employee") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  if (user.role === "manager") {
    return (
      <Navigate
        to="/manager-dashboard"
        replace
      />
    );
  }

  if (user.role === "departmentHead") {
    return (
      <Navigate
        to="/department-head-dashboard"
        replace
      />
    );
  }

  if (user.role === "hr") {
    return (
      <Navigate
        to="/hr-dashboard"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/"
      replace
    />
  );
}


/* =========================================================
   MANAGER ROUTE
========================================================= */

function ManagerRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (user.role !== "manager") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}


/* =========================================================
   DEPARTMENT HEAD ROUTE
========================================================= */

function DepartmentHeadRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const user = getStoredUser();

  console.log("========== DEPARTMENT HEAD ROUTE ==========");
  console.log("Token:", !!token);
  console.log("User:", user);
  console.log("Role:", user?.role);

  if (!token || !user) {
    console.log(
      "Department Head Route: token or user missing"
    );

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (user.role !== "departmentHead") {
    console.log(
      "Department Head Route: wrong role:",
      user.role
    );

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  console.log(
    "Department Head Route Passed"
  );

  return children;
}


/* =========================================================
   HR ROUTE
========================================================= */

function HRRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const user = getStoredUser();

  console.log("========== HR ROUTE ==========");
  console.log("Token:", token);
  console.log("User:", user);
  console.log("Role:", user?.role);

  if (!token || !user) {
    console.log(
      "Redirecting because token or user is missing"
    );

    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (user.role !== "hr") {
    console.log(
      "Role is not hr:",
      user.role
    );

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  console.log("HR Route Passed");

  return children;
}

/* =========================================================
   LEAVE HISTORY ROUTE
   Available for:
   Employee
   Manager
   Department Head
   HR
========================================================= */
function LeaveHistoryRoute({ children }) {
  const token = sessionStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const allowedRoles = [
    "employee",
    "manager",
    "departmentHead",
    "hr",
  ];

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


/* =========================================================
   PROTECTED LAYOUT
========================================================= */

function ProtectedLayout({ children }) {
  return (
    <>
      <Navbar />

      <main>
        {children}
      </main>
    </>
  );
}


/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>

      <div className="App">

        <Routes>


          {/* =================================================
              LOGIN
          ================================================= */}

          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />


          {/* =================================================
              REGISTER
          ================================================= */}

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />


          {/* =================================================
              EMPLOYEE DASHBOARD
          ================================================= */}

          <Route
            path="/dashboard"
            element={
              <EmployeeRoute>
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              </EmployeeRoute>
            }
          />


          {/* =================================================
              APPLY LEAVE
              
              Available for:
              Employee
              Manager
              Department Head
              HR
              Admin
          ================================================= */}

          <Route
            path="/apply-leave"
            element={
              <ProtectedLayout>
                <ApplyLeave />
              </ProtectedLayout>
            }
          />


          {/* =================================================
              LEAVE HISTORY
              
              Employee route remains unchanged.
          ================================================= */}

               <Route
                  path="/leave-history"
                  element={
                    <LeaveHistoryRoute>
                      <ProtectedLayout>
                        <LeaveHistory />
                      </ProtectedLayout>
                    </LeaveHistoryRoute>
                  }
                />

          {/* =================================================
              ADMIN DASHBOARD
          ================================================= */}

          <Route
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <AdminDashboard />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              ADMIN HOLIDAY CALENDAR
          ================================================= */}

          <Route
            path="/admin/holiday-calendar"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <HolidayCalendar />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              FORGOT PASSWORD
          ================================================= */}

          <Route
            path="/forgot-password"
            element={
              <ForgotPassword />
            }
          />


          {/* =================================================
              RESET PASSWORD
          ================================================= */}

          <Route
            path="/reset-password/:token"
            element={
              <ResetPassword />
            }
          />


          {/* =================================================
              MANAGER DASHBOARD
          ================================================= */}

          <Route
            path="/manager-dashboard"
            element={
              <ManagerRoute>
                <ProtectedLayout>
                  <ManagerDashboard />
                </ProtectedLayout>
              </ManagerRoute>
            }
          />


          {/* =================================================
              MANAGER TEAM
          ================================================= */}

          <Route
            path="/manager-team"
            element={
              <ManagerRoute>
                <ProtectedLayout>
                  <ManagerTeam />
                </ProtectedLayout>
              </ManagerRoute>
            }
          />


          {/* =================================================
              ADMIN MANAGE LEAVES
          ================================================= */}

          <Route
            path="/manage-leaves"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <ManageLeaves />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              ADMIN DEPARTMENTS
          ================================================= */}

          <Route
            path="/departments"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <Departments />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              MANAGER LEAVE REQUESTS
          ================================================= */}

          <Route
            path="/manager/leave-requests"
            element={
              <ManagerRoute>
                <ProtectedLayout>
                  <ManagerLeaveRequests />
                </ProtectedLayout>
              </ManagerRoute>
            }
          />


          {/* =================================================
              DEPARTMENT HEAD DASHBOARD

              FIXED:
              DepartmentHeadRoute added
          ================================================= */}

          <Route
            path="/department-head-dashboard"
            element={
              <DepartmentHeadRoute>
                <ProtectedLayout>
                  <DepartmentHeadDashboard />
                </ProtectedLayout>
              </DepartmentHeadRoute>
            }
          />


          {/* =================================================
              DEPARTMENT HEAD LEAVE REQUESTS

              FIXED:
              DepartmentHeadRoute added
          ================================================= */}
              <Route
                path="/department-head/leave-requests"
                element={
                  <DepartmentHeadRoute>
                    <ProtectedLayout>
                      <DepartmentHeadLeaveRequests />
                    </ProtectedLayout>
                  </DepartmentHeadRoute>
                }
              />
          {/* =================================================
              HR DASHBOARD
          ================================================= */}

          <Route
            path="/hr-dashboard"
            element={
              <HRRoute>
                <ProtectedLayout>
                  <HRDashboard />
                </ProtectedLayout>
              </HRRoute>
            }
          />


          {/* =================================================
              HR LEAVE REQUESTS
          ================================================= */}

          <Route
            path="/hr/leave-requests"
            element={
              <HRRoute>
                <ProtectedLayout>
                  <HRLeaveRequests />
                </ProtectedLayout>
              </HRRoute>
            }
          />


          {/* =================================================
              EMPLOYEES
          ================================================= */}

          <Route
            path="/employees"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <Employees />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              ADMIN MANAGERS
          ================================================= */}

          <Route
            path="/admin/managers"
            element={
              <Managers />
            }
          />


          {/* =================================================
              ADMIN DEPARTMENT HEADS
          ================================================= */}

          <Route
            path="/admin/department-heads"
            element={
              <DepartmentHeads />
            }
          />


          {/* =================================================
              ADMIN HR
          ================================================= */}

          <Route
            path="/admin/hr"
            element={
              <HR />
            }
          />


          {/* =================================================
              ADD EMPLOYEE
          ================================================= */}

          <Route
            path="/add-employee"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <AddEmployee />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              EDIT EMPLOYEE
          ================================================= */}

          <Route
            path="/edit-employee/:id"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <EditEmployee />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              REPORTS
          ================================================= */}

          <Route
            path="/reports"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <Reports />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <Route
            path="/notifications"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <Notifications />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              YEARLY LEAVE BALANCES
          ================================================= */}

          <Route
            path="/yearly-leave-balances"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <YearlyLeaveBalances />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              HOLIDAY MANAGEMENT
          ================================================= */}

          <Route
            path="/holiday-management"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <HolidayManagement />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              HOLIDAYS
          ================================================= */}

          <Route
            path="/holidays"
            element={
              <EmployeeRoute>
                <ProtectedLayout>
                  <Holidays />
                </ProtectedLayout>
              </EmployeeRoute>
            }
          />


          {/* =================================================
              HOLIDAY CALENDAR
          ================================================= */}

          <Route
            path="/holiday-calendar"
            element={
              <EmployeeRoute>
                <ProtectedLayout>
                  <HolidayCalendar />
                </ProtectedLayout>
              </EmployeeRoute>
            }
          />


          {/* =================================================
              EMPLOYEE DETAILS
          ================================================= */}

          <Route
            path="/employees/:id"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <EmployeeDetails />
                </ProtectedLayout>
              </AdminRoute>
            }
          />


          {/* =================================================
              MANAGER EMPLOYEE DETAILS
          ================================================= */}

          <Route
            path="/manager/employees/:id"
            element={
              <ManagerRoute>
                <ProtectedLayout>
                  <EmployeeDetails />
                </ProtectedLayout>
              </ManagerRoute>
            }
          />


          {/* =================================================
              UNKNOWN URL
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </div>

    </BrowserRouter>
  );
}


export default App;
