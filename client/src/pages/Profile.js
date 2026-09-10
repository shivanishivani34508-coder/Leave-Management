import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    leaveBalance: {
      Casual: 0,
      Sick: 0,
      Earned: 0,
    },
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ==========================
  // GET PROFILE
  // ==========================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setProfileError("");

      const token = localStorage.getItem("token");

      const response = await api.get("/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProfile({
        name: response.data.name || "",
        email: response.data.email || "",
        role: response.data.role || "",

        leaveBalance: {
          Casual: response.data.leaveBalance?.Casual ?? 0,
          Sick: response.data.leaveBalance?.Sick ?? 0,
          Earned: response.data.leaveBalance?.Earned ?? 0,
        },
      });
    } catch (err) {
      console.log("GET PROFILE ERROR:", err);

      setProfileError(
        err.response?.data?.message ||
          "Unable to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ==========================
  // PROFILE INPUT CHANGE
  // ==========================

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });

    setProfileMessage("");
    setProfileError("");
  };

  // ==========================
  // UPDATE PROFILE
  // ==========================

  const updateProfile = async (e) => {
    e.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (!profile.name.trim()) {
      setProfileError("Name is required");
      return;
    }

    try {
      setUpdatingProfile(true);

      const token = localStorage.getItem("token");

      const response = await api.put(
        "/users/profile",

        {
          name: profile.name.trim(),
        },

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProfileMessage(response.data.message);

      // Update localStorage user
      const storedUser = JSON.parse(
        localStorage.getItem("user")
      );

      const updatedUser = {
        ...storedUser,
        ...response.data.user,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setProfile((currentProfile) => ({
        ...currentProfile,
        name: response.data.user.name,
      }));
    } catch (err) {
      console.log("UPDATE PROFILE ERROR:", err);

      setProfileError(
        err.response?.data?.message ||
          "Unable to update profile"
      );
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ==========================
  // PASSWORD INPUT CHANGE
  // ==========================

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });

    setPasswordMessage("");
    setPasswordError("");
  };

  // ==========================
  // CHANGE PASSWORD
  // ==========================

  const changePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("Please fill all password fields");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters"
      );
      return;
    }

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setPasswordError(
        "New password and confirm password do not match"
      );
      return;
    }

    try {
      setChangingPassword(true);

      const token = localStorage.getItem("token");

      const response = await api.put(
        "/users/change-password",

        passwordData,

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPasswordMessage(response.data.message);

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Logout after successful password change
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");
      }, 1500);
    } catch (err) {
      console.log("CHANGE PASSWORD ERROR:", err);

      setPasswordError(
        err.response?.data?.message ||
          "Unable to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  // ==========================
  // LOADING
  // ==========================

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: "50px" }}>
        Loading Profile...
      </p>
    );
  }

  return (
    <div
      style={{
        maxWidth: "700px",
        margin: "40px auto",
        padding: "20px",
      }}
    >
      <h1 style={{ textAlign: "center" }}>
        Employee Profile
      </h1>

      <div style={{ textAlign: "center", marginBottom: "25px" }}>
        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>

      {/* ==========================
          PROFILE DETAILS
      ========================== */}

      <div className="card">
        <h2>Profile Details</h2>

        {profileMessage && (
          <div className="success-message">
            {profileMessage}
          </div>
        )}

        {profileError && (
          <div className="error-message">
            {profileError}
          </div>
        )}

        <form onSubmit={updateProfile}>
          <label>Name</label>

          <br />

          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleProfileChange}
            style={{
              width: "100%",
              marginTop: "7px",
              marginBottom: "15px",
            }}
          />

          <label>Email</label>

          <br />

          <input
            type="email"
            value={profile.email}
            disabled
            style={{
              width: "100%",
              marginTop: "7px",
              marginBottom: "15px",
            }}
          />

          <label>Role</label>

          <br />

          <input
            type="text"
            value={profile.role}
            disabled
            style={{
              width: "100%",
              marginTop: "7px",
              marginBottom: "20px",
            }}
          />

          <button
            type="submit"
            disabled={updatingProfile}
          >
            {updatingProfile
              ? "Updating..."
              : "Update Profile"}
          </button>
        </form>
      </div>

      <br />

      {/* ==========================
          LEAVE BALANCE
      ========================== */}

      <div className="card">
        <h2>Leave Balance</h2>

        <p>
          <b>Casual Leave:</b>{" "}
          {profile.leaveBalance.Casual} days
        </p>

        <p>
          <b>Sick Leave:</b>{" "}
          {profile.leaveBalance.Sick} days
        </p>

        <p>
          <b>Earned Leave:</b>{" "}
          {profile.leaveBalance.Earned} days
        </p>
      </div>

      <br />

      {/* ==========================
          CHANGE PASSWORD
      ========================== */}

      <div className="card">
        <h2>Change Password</h2>

        {passwordMessage && (
          <div className="success-message">
            {passwordMessage}
          </div>
        )}

        {passwordError && (
          <div className="error-message">
            {passwordError}
          </div>
        )}

        <form onSubmit={changePassword}>
          <label>Current Password</label>

          <br />

          <input
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            required
            style={{
              width: "100%",
              marginTop: "7px",
              marginBottom: "15px",
            }}
          />

          <label>New Password</label>

          <br />

          <input
            type="password"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            required
            style={{
              width: "100%",
              marginTop: "7px",
              marginBottom: "15px",
            }}
          />

          <label>Confirm New Password</label>

          <br />

          <input
            type="password"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
            style={{
              width: "100%",
              marginTop: "7px",
              marginBottom: "20px",
            }}
          />

          <button
            type="submit"
            disabled={changingPassword}
          >
            {changingPassword
              ? "Changing Password..."
              : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;