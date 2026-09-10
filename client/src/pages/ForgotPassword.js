import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    /* =====================================================
       VALIDATE EMAIL
    ===================================================== */

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    /* =====================================================
       VALIDATE PASSWORD
    ===================================================== */

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    /* =====================================================
       CONFIRM PASSWORD
    ===================================================== */

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    /* =====================================================
       SEND REQUEST
    ===================================================== */

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/reset-password",
        {
          email: email.trim(),
          password,
        }
      );

      setMessage(
        response.data.message ||
          "Password reset successfully."
      );

      setPassword("");
      setConfirmPassword("");

      /* ===================================================
         GO BACK TO LOGIN
      =================================================== */

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error(
        "RESET PASSWORD ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)",
        padding: "30px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "470px",
          background: "#ffffff",
          borderRadius: "24px",
          padding: "42px",
          boxShadow:
            "0 20px 60px rgba(30, 41, 59, 0.14)",
          boxSizing: "border-box",
        }}
      >
        {/* =================================================
            ICON
        ================================================= */}

        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg, #2563eb, #4f46e5)",
            fontSize: "34px",
            marginBottom: "22px",
            boxShadow:
              "0 12px 25px rgba(37, 99, 235, 0.25)",
          }}
        >
          🔐
        </div>

        {/* =================================================
            TITLE
        ================================================= */}

        <h1
          style={{
            margin: "0 0 10px",
            color: "#172554",
            fontSize: "30px",
            fontWeight: "800",
          }}
        >
          Reset Password
        </h1>

        <p
          style={{
            margin: "0 0 28px",
            color: "#64748b",
            lineHeight: "1.6",
            fontSize: "15px",
          }}
        >
          Enter your registered email and create a
          new password for your LeaveFlow account.
        </p>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {message && (
          <div
            style={{
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              padding: "14px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            ✓ {message}
          </div>
        )}

        {/* =================================================
            ERROR MESSAGE
        ================================================= */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "14px",
              borderRadius: "12px",
              marginBottom: "20px",
              fontSize: "14px",
              lineHeight: "1.5",
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleResetPassword}>

          {/* EMAIL */}

          <label
            htmlFor="reset-email"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#334155",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            Email Address
          </label>

          <input
            id="reset-email"
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
            style={{
              width: "100%",
              height: "54px",
              boxSizing: "border-box",
              padding: "0 15px",
              borderRadius: "12px",
              border: "1px solid #dbe3f0",
              background: "#f8fafc",
              outline: "none",
              fontSize: "15px",
              marginBottom: "20px",
            }}
          />

          {/* NEW PASSWORD */}

          <label
            htmlFor="new-password"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#334155",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            New Password
          </label>

          <input
            id="new-password"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
            style={{
              width: "100%",
              height: "54px",
              boxSizing: "border-box",
              padding: "0 15px",
              borderRadius: "12px",
              border: "1px solid #dbe3f0",
              background: "#f8fafc",
              outline: "none",
              fontSize: "15px",
              marginBottom: "20px",
            }}
          />

          {/* CONFIRM PASSWORD */}

          <label
            htmlFor="confirm-password"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#334155",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            Confirm Password
          </label>

          <input
            id="confirm-password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            required
            style={{
              width: "100%",
              height: "54px",
              boxSizing: "border-box",
              padding: "0 15px",
              borderRadius: "12px",
              border: "1px solid #dbe3f0",
              background: "#f8fafc",
              outline: "none",
              fontSize: "15px",
              marginBottom: "24px",
            }}
          />

          {/* RESET BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "54px",
              border: "none",
              borderRadius: "13px",
              background:
                "linear-gradient(135deg, #2563eb, #4f46e5)",
              color: "#ffffff",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow:
                "0 10px 25px rgba(37, 99, 235, 0.22)",
            }}
          >
            {loading
              ? "Resetting Password..."
              : "Reset Password"}
          </button>
        </form>

        {/* BACK TO LOGIN */}

        <Link
          to="/"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: "24px",
            color: "#2563eb",
            fontSize: "14px",
            fontWeight: "700",
            textDecoration: "none",
          }}
        >
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}

export default ForgotPassword;