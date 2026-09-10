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
import HR from "./pages/HR";import HRDashboard from "./pages/HRDashboard";
import ManagerLeaveRequests from "./pages/ManagerLeaveRequests";
import DepartmentHeadDashboard from "./pages/DepartmentHeadDashboard";
import DepartmentHeadLeaveRequests from "./pages/DepartmentHeadLeaveRequests";
import HRLeaveRequests from "./pages/HRLeaveRequests";
import Departments from "./pages/Departments";
import EditEmployee from "./pages/EditEmployee";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import YearlyLeaveBalances from "./pages/YearlyLeaveBalances";

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error("INVALID STORED USER:", error);

    localStorage.removeItem("user");

    return null;
  }
}


function PublicRoute({ children }) {
  const token = localStorage.getItem("token");
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

function EmployeeRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === "employee") {
    return children; 
  }

  if (user.role === "admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  if (user.role === "manager") {
    return <Navigate to="/manager-dashboard" replace />;
  }

  if (user.role === "departmentHead") {
    return <Navigate to="/department-head-dashboard" replace />;
  }

  if (user.role === "hr") {
    return <Navigate to="/hr-dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  console.log("AdminRoute:", {
  token: !!token,
  role: user?.role,
});

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role === "admin") {
    return children;
  }

  if (user.role === "employee") {
    return <Navigate to="/dashboard" replace />;
  }

  if (user.role === "manager") {
    return <Navigate to="/manager-dashboard" replace />;
  }

  if (user.role === "departmentHead") {
    return <Navigate to="/department-head-dashboard" replace />;
  }

  if (user.role === "hr") {
    return <Navigate to="/hr-dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

function ManagerRoute({ children }) {
  const token = localStorage.getItem("token");
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
function DepartmentHeadRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  console.log("TOKEN:", token);
  console.log("USER:", user);

  if (!token || !user) {
    console.log("Redirecting because token or user is missing");
    return <Navigate to="/" replace />;
  }

  console.log("USER ROLE:", user.role);

  if (user.role !== "departmentHead") {
    console.log("Redirecting because role is not departmentHead");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("DepartmentHeadRoute passed");

  return children;
}
function HRRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  console.log("========== HR ROUTE ==========");
  console.log("Token:", token);
  console.log("User:", user);
  console.log("Role:", user?.role);

  if (!token || !user) {
    console.log("Redirecting because token or user is missing");
    return <Navigate to="/" replace />;
  }

  if (user.role !== "hr") {
    console.log("Role is not hr:", user.role);
    return <Navigate to="/dashboard" replace />;
  }

  console.log("HR Route Passed");

  return children;
}
function ProtectedLayout({ children }) {
  return (
    <>
      <Navbar />

      <main>{children}</main>
    </>
  );
}


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>

          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

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

          <Route
            path="/apply-leave"
            element={
              <EmployeeRoute>
                <ProtectedLayout>
                  <ApplyLeave />
                </ProtectedLayout>
              </EmployeeRoute>
            }
          />

          <Route
            path="/leave-history"
            element={
              <EmployeeRoute>
                <ProtectedLayout>
                  <LeaveHistory />
                </ProtectedLayout>
              </EmployeeRoute>
            }
          />
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

<Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password/:token"
  element={<ResetPassword />}
/>

         
        
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
<Route
  path="/department-head-dashboard"
  element={
    <ProtectedLayout>
      <DepartmentHeadDashboard />
    </ProtectedLayout>
  }
/>

<Route
  path="/department-head/leave-requests"
  element={
    <ProtectedLayout>
      <DepartmentHeadLeaveRequests />
    </ProtectedLayout>
  }
/>
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

          <Route path="/admin/managers" element={<Managers />} />

<Route
  path="/admin/department-heads"
  element={<DepartmentHeads />}
/>

<Route path="/admin/hr" element={<HR />} />

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


          {/* OLD EMPLOYEE DETAILS URLs GO BACK TO EMPLOYEES */}

          <Route
            path="/employees/:id"
            element={
              <AdminRoute>
                <ProtectedLayout>
                  <EmployeeDetails/>
                </ProtectedLayout>
               </AdminRoute> 
      
            }
          />

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