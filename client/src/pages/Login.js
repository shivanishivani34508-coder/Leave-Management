import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  /* =========================================================
     STATE
  ========================================================= */

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (message) {
      setMessage("");
    }
  };

  /* =========================================================
     LOGIN SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = formData.email.trim();
    const password = formData.password;

    /* -------------------------
       FRONTEND VALIDATION
    ------------------------- */

    if (!email || !password) {
      setMessageType("error");
      setMessage("Please enter your email address and password.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      /* -------------------------
         CALL BACKEND LOGIN API
      ------------------------- */

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const token = response.data?.token;
      const user = response.data?.user;

      /* -------------------------
         CHECK BACKEND RESPONSE
      ------------------------- */

      if (!token || !user) {
        setMessageType("error");
        setMessage(
          "Login response is incomplete. Please check your backend login controller."
        );
        return;
      }

      /* -------------------------
         SAVE LOGIN DATA
      ------------------------- */

      sessionStorage.setItem("token", token);

      sessionStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      /* -------------------------
         REDIRECT BASED ON ROLE
      ------------------------- */

      switch (user.role) {
        case "admin":
          navigate("/admin-dashboard", {
            replace: true,
          });
          break;

        case "manager":
          navigate("/manager-dashboard", {
            replace: true,
          });
          break;

        case "departmentHead":
          navigate("/department-head-dashboard", {
            replace: true,
          });
          break;

        case "hr":
          navigate("/hr-dashboard", {
            replace: true,
          });
          break;

        case "employee":
        default:
          navigate("/dashboard", {
            replace: true,
          });
          break;
      }

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessageType("error");

      if (!error.response) {
        setMessage(
          "Cannot connect to the server. Make sure your backend is running on port 5000."
        );
      } else {
        setMessage(
          error.response?.data?.message ||
            "Login failed. Please check your email and password."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */
const handleForgotPassword = () => {
  navigate("/forgot-password");
};

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="login-page">

  <div className="login-container">

    {/* =====================================================
        LEFT SIDE
    ===================================================== */}

    <section className="login-brand-section">

      <div className="login-brand-content">

        <div className="login-logo">
          LM
        </div>

        <h1 className="login-brand-title">
          Smarter Leave Management Starts Here.
        </h1>

        <p className="login-brand-description">
          Manage employee leave requests, approvals,
          leave history, and workforce information
          from one secure and simple platform.
        </p>

        {/* FEATURES */}

        <div className="login-features">

          <div className="login-feature-item">

            <span className="login-feature-icon">
              ✓
            </span>

            <span>
              Quick and simple leave applications
            </span>

          </div>

          <div className="login-feature-item">

            <span className="login-feature-icon">
              ✓
            </span>

            <span>
              Transparent approval tracking
            </span>

          </div>

          <div className="login-feature-item">

            <span className="login-feature-icon">
              ✓
            </span>

            <span>
              Secure employee and admin access
            </span>

          </div>

        </div>

      </div>

      <div className="login-brand-footer">
        © 2026 LeaveFlow. Leave Management System.
      </div>

    </section>

    {/* =====================================================
        RIGHT SIDE
    ===================================================== */}

    <section className="login-form-section">

      <div className="login-form-wrapper">

        {/* HEADER */}

        <div className="login-form-header">

          <h2>
            Welcome back
          </h2>

          <p>
            Sign in to continue to your LeaveFlow account.
          </p>

        </div>

        {/* MESSAGE */}

        {message && (

          <div
            className={`login-message ${messageType}`}
          >
            {message}
          </div>

        )}
                {/* LOGIN FORM */}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          {/* EMAIL */}

          <div className="login-form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <div className="login-input-wrapper">

              <span className="login-input-icon">
                ✉
              </span>

              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={loading}
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div className="login-form-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="login-input-wrapper">

              <span className="login-input-icon">
                🔒
              </span>

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() =>
                  setShowPassword(
                    (previousState) => !previousState
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                disabled={loading}
              >
                {showPassword ? "🙈" : "👁"}
              </button>

            </div>

          </div>


          {/* OPTIONS */}

          <div className="login-form-options">

            <label className="login-remember">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked
                  )
                }
                disabled={loading}
              />

              <span>
                Remember me
              </span>

            </label>

            <button
              type="button"
              className="login-forgot-link"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot password?
            </button>

          </div>


          {/* LOGIN BUTTON */}

          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >

            {loading
              ? "Signing in..."
              : "Sign In"}

            {!loading && (
              <span>
                →
              </span>
            )}

          </button>

        </form>
                {/* REGISTER */}

        <div className="login-register-section">

          <span>
            Don't have an account?
          </span>

          <Link
            to="/register"
            className="login-register-link"
          >
            Create account
          </Link>

        </div>

      </div>

    </section>

  </div>

</div>

  );
}

export default Login;
