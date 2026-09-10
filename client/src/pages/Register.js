import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  /* =========================================================
     HANDLE INPUT CHANGE
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
     VALIDATE EMAIL
  ========================================================= */

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /* =========================================================
     HANDLE REGISTER
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    /* -------------------------
       EMPTY FIELD VALIDATION
    ------------------------- */

    if (!name || !email || !password || !confirmPassword) {
      setMessageType("error");
      setMessage("Please fill in all required fields.");
      return;
    }

    /* -------------------------
       NAME VALIDATION
    ------------------------- */

    if (name.length < 2) {
      setMessageType("error");
      setMessage("Name must contain at least 2 characters.");
      return;
    }

    /* -------------------------
       EMAIL VALIDATION
    ------------------------- */

    if (!isValidEmail(email)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    /* -------------------------
       PASSWORD VALIDATION
    ------------------------- */

    if (password.length < 6) {
      setMessageType("error");
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    /* -------------------------
       CONFIRM PASSWORD
    ------------------------- */

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      /* -------------------------
         CALL REGISTER API

         Do not send role from the public registration page.
         Backend should assign employee role by default.
      ------------------------- */

      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      console.log("REGISTER RESPONSE:", response.data);

      setMessageType("success");

      setMessage(
        response.data?.message ||
          "Account created successfully. Redirecting to sign in..."
      );

      /* -------------------------
         CLEAR FORM
      ------------------------- */

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      /* -------------------------
         REDIRECT TO LOGIN
      ------------------------- */

      setTimeout(() => {
        navigate("/", {
          replace: true,
        });
      }, 1500);
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      setMessageType("error");

      if (!error.response) {
        setMessage(
          "Cannot connect to the server. Make sure your backend is running on port 5000."
        );
      } else {
        setMessage(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">

        {/* =====================================================
            LEFT BRAND SECTION
        ===================================================== */}

        <section className="register-brand-section">
          <div className="register-brand-content">

            <div className="register-logo">
              LM
            </div>

            <h1 className="register-brand-title">
              Start Managing Your Leave Smarter.
            </h1>

            <p className="register-brand-description">
              Create your employee account to apply for leave,
              track approval status, view leave history, and manage
              your leave requests from one simple platform.
            </p>

            <div className="register-features">

              <div className="register-feature-item">
                <span className="register-feature-icon">
                  ✓
                </span>

                <span>
                  Submit leave requests in minutes
                </span>
              </div>

              <div className="register-feature-item">
                <span className="register-feature-icon">
                  ✓
                </span>

                <span>
                  Track pending, approved, and rejected leaves
                </span>
              </div>

              <div className="register-feature-item">
                <span className="register-feature-icon">
                  ✓
                </span>

                <span>
                  Secure employee account access
                </span>
              </div>

            </div>
          </div>

          <div className="register-brand-footer">
            © 2026 LeaveFlow. Leave Management System.
          </div>
        </section>


        {/* =====================================================
            RIGHT FORM SECTION
        ===================================================== */}

        <section className="register-form-section">
          <div className="register-form-wrapper">

            <div className="register-form-header">
              <h2>Create account</h2>

              <p>
                Enter your details to create your LeaveFlow
                employee account.
              </p>
            </div>


            {/* MESSAGE */}

            {message && (
              <div
                className={`register-message ${messageType}`}
              >
                {message}
              </div>
            )}


            {/* REGISTER FORM */}

            <form
              className="register-form"
              onSubmit={handleSubmit}
            >

              {/* FULL NAME */}

              <div className="register-form-group">
                <label htmlFor="name">
                  Full Name
                </label>

                <div className="register-input-wrapper">
                  <span className="register-input-icon">
                    👤
                  </span>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={loading}
                  />
                </div>
              </div>


              {/* EMAIL */}

              <div className="register-form-group">
                <label htmlFor="register-email">
                  Email Address
                </label>

                <div className="register-input-wrapper">
                  <span className="register-input-icon">
                    ✉
                  </span>

                  <input
                    id="register-email"
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

              <div className="register-form-group">
                <label htmlFor="register-password">
                  Password
                </label>

                <div className="register-input-wrapper">
                  <span className="register-input-icon">
                    🔒
                  </span>

                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
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


              {/* CONFIRM PASSWORD */}

              <div className="register-form-group">
                <label htmlFor="confirm-password">
                  Confirm Password
                </label>

                <div className="register-input-wrapper">
                  <span className="register-input-icon">
                    🔐
                  </span>

                  <input
                    id="confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Enter password again"
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="register-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previousState) => !previousState
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    disabled={loading}
                  >
                    {showConfirmPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>


              {/* REGISTER BUTTON */}

              <button
                type="submit"
                className="register-submit-btn"
                disabled={loading}
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}

                {!loading && <span>→</span>}
              </button>

            </form>


            {/* LOGIN LINK */}

            <div className="register-login-section">
              <span>
                Already have an account?
              </span>

              <Link
                to="/"
                className="register-login-link"
              >
                Sign in
              </Link>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

export default Register;