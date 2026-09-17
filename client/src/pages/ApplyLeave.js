import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ApplyLeave.css";

const LEAVE_TYPES = [
  { value: "Casual", label: "Casual Leave", balanceKey: "casual" },
  { value: "Sick", label: "Sick Leave", balanceKey: "sick" },
  { value: "Earned", label: "Earned Leave", balanceKey: "earned" },
  { value: "Marriage", label: "Marriage Leave", balanceKey: "marriage" },
  {
    value: "Maternity",
    label: "Maternity Leave",
    balanceKey: "maternity",
  },
  {
    value: "Paternity",
    label: "Paternity Leave",
    balanceKey: "paternity",
  },
  {
    value: "Bereavement",
    label: "Bereavement Leave",
    balanceKey: "bereavement",
  },
  {
    value: "Leave Without Pay",
    label: "Leave Without Pay (LWP)",
    balanceKey: null,
  },
];

function ApplyLeave() {
const navigate = useNavigate();
const [user, setUser] = useState(null);
const [yearlyBalance, setYearlyBalance] = useState(null);



  const [profileLoading, setProfileLoading] = useState(true);

  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    durationType: "Full Day",
    halfDaySession: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

 const availableLeaveTypes = useMemo(() => {
  if (!user) {
    return [];
  }

  if (user.gender === "Male") {
    return LEAVE_TYPES.filter(
      (leaveType) => leaveType.value !== "Maternity"
    );
  }

  if (user.gender === "Female") {
    return LEAVE_TYPES.filter(
      (leaveType) => leaveType.value !== "Paternity"
    );
  }

  return LEAVE_TYPES;
}, [user]);

console.log("================================");
console.log("USER OBJECT:", user);
console.log("USER GENDER:", user?.gender);
console.log(
  "LEAVE TYPES:",
  availableLeaveTypes.map((item) => item.value)
);
console.log("================================");
  /* =========================================================
     AUTH CONFIG
  ========================================================= */

  const getAuthConfig = () => {
    const token = sessionStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  /* =========================================================
     UNAUTHORIZED HANDLER
  ========================================================= */

  const handleUnauthorized = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    navigate("/", { replace: true });
  };

  /* =========================================================
     FETCH LATEST EMPLOYEE PROFILE
  ========================================================= */

  useEffect(() => {
    
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setMessage("");

        const token = sessionStorage.getItem("token");

        if (!token) {
          handleUnauthorized();
          return;
        }

        const response = await api.get(
          "/users/profile",
          getAuthConfig()
        );

        const profile = response.data?.user || response.data;

        if (!profile) {
          throw new Error("Employee profile was not returned.");
        }
      if (
        !["employee", "manager", "departmentHead", "hr", "admin"].includes(
          profile.role
        )
      ) {
        navigate("/", { replace: true });
        return;
      }
console.log("FULL PROFILE:", profile);
console.log("LEAVE BALANCES:", profile.leaveBalances);

console.log("FULL PROFILE OBJECT:", profile);

setUser(profile);

        const currentYear = new Date().getFullYear();
        const yearlyBalanceResponse = await api.get(
          `/yearly-leave-balances/my?year=${currentYear}`,
          getAuthConfig()
        );

        setYearlyBalance(
          yearlyBalanceResponse.data?.balance || null
        );

console.log("PROFILE:", profile);
console.log("GENDER:", profile.gender);
        

        /*
          Keep this tab's user information synchronized.

          We intentionally keep the existing token separately.
        */

        sessionStorage.setItem(
          "user",
          JSON.stringify(profile)
        );
      } catch (error) {
        console.error("FETCH PROFILE ERROR:", error);

        if (
          error.response?.status === 401 ||
          error.response?.status === 403
        ) {
          handleUnauthorized();
          return;
        }

        setMessageType("error");

        setMessage(
          error.response?.data?.message ||
            "Unable to load your current leave balances."
        );
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => {
      const updatedData = {
        ...previousData,
        [name]: value,
      };

      if (
  name === "startDate" &&
  previousData.durationType === "Half Day"
) {
  updatedData.endDate = value;
}

if (
  name === "durationType" &&
  value === "Half Day" &&
  previousData.startDate
) {
  updatedData.endDate = previousData.startDate;
}

      /*
        If start date becomes later than the current end date,
        clear the end date.
      */

      if (
        name === "startDate" &&
        previousData.endDate &&
        new Date(`${value}T00:00:00`) >
          new Date(`${previousData.endDate}T00:00:00`)
      ) {
        updatedData.endDate = "";
      }

      return updatedData;
    });

    if (message) {
      setMessage("");
    }
  };

  /* =========================================================
     TODAY DATE
  ========================================================= */

  const getTodayDate = () => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  /* =========================================================
     CALCULATE DURATION

     Matches current backend calculation:
     calendar days, including start and end dates.
  ========================================================= */

  const calculateDuration = () => {
    if (
      !formData.startDate ||
      !formData.endDate
    ) {
      return 0;
    }

    const startDate = new Date(
      `${formData.startDate}T00:00:00`
    );

    const endDate = new Date(
      `${formData.endDate}T00:00:00`
    );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate < startDate
    ) {
      return 0;
    }

    const difference =
      endDate.getTime() - startDate.getTime();

    return (
      Math.floor(
        difference / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  /* =========================================================
     SELECTED LEAVE CONFIGURATION
  ========================================================= */

  const selectedLeaveType = useMemo(() => {
    return LEAVE_TYPES.find(
      (leaveType) =>
        leaveType.value === formData.leaveType
    );
  }, [formData.leaveType]);

  /* =========================================================
     CURRENT AVAILABLE BALANCE
  ========================================================= */

const availableBalance = useMemo(() => {

  console.log("USER:", user);
  console.log("LEAVE BALANCES:", user?.leaveBalances);
  console.log("SELECTED TYPE:", formData.leaveType);
  console.log("BALANCE KEY:", selectedLeaveType?.balanceKey);

  if (!selectedLeaveType || !selectedLeaveType.balanceKey) {
    return 0;
  }

  return Number(
    yearlyBalance?.[selectedLeaveType.balanceKey]?.remaining ??
      user?.leaveBalances?.[selectedLeaveType.balanceKey] ??
      0
  );

}, [user, yearlyBalance, selectedLeaveType, formData.leaveType]);
  /* =========================================================
     PAID / UNPAID PREVIEW

     This is an estimate.

     Backend remains the final authority because Pending
     requests can reserve paid balance.
  ========================================================= */

  const duration = calculateDuration();

  const finalDuration =
  formData.durationType === "Half Day"
    ? 0.5
    : duration;

  const estimatedPaidDays = useMemo(() => {
    if (
      !formData.leaveType ||
      duration <= 0 ||
      formData.leaveType === "Leave Without Pay"
    ) {
      return 0;
    }

    return Math.min(finalDuration, availableBalance);
  }, [
    formData.leaveType,
    duration,
    availableBalance,
  ]);

 const estimatedUnpaidDays = useMemo(() => {
  if (finalDuration <= 0) {
    return 0;
  }

  return finalDuration - estimatedPaidDays;
}, [finalDuration, estimatedPaidDays]);

  /* =========================================================
     INITIALS
  ========================================================= */

  const getInitials = (name) => {
    if (!name) {
      return "U";
    }

    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  /* =========================================================
     CANCEL
  ========================================================= */

  const handleCancel = () => {
    navigate("/dashboard");
  };

  /* =========================================================
     SUBMIT LEAVE
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

   const {
  leaveType,
  startDate,
  endDate,
  durationType,
  halfDaySession,
} = formData;

    const reason = formData.reason.trim();
    const actualEndDate =
    durationType === "Half Day"
    ? startDate
    : endDate;

    /* -------------------------------------------------------
       REQUIRED FIELDS
    ------------------------------------------------------- */

    if (
      !leaveType ||
      !startDate ||
      !actualEndDate||
      !reason
    ) {
      setMessageType("error");
      setMessage(
        "Please fill in all required fields."
      );

      return;
    }

    if (
  durationType === "Half Day" &&
  !halfDaySession
) {
  setMessageType("error");

  setMessage(
    "Please select First Half or Second Half."
  );

  return;
}

    /* -------------------------------------------------------
       DATE VALIDATION
    ------------------------------------------------------- */

    const selectedStartDate = new Date(
      `${startDate}T00:00:00`
    );

    const selectedEndDate = new Date(
      `${endDate}T00:00:00`
    );

    const today = new Date(
      `${getTodayDate()}T00:00:00`
    );

    if (selectedStartDate < today) {
      setMessageType("error");

      setMessage(
        "Start date cannot be earlier than today."
      );

      return;
    }

    if (selectedEndDate < selectedStartDate) {
      setMessageType("error");

      setMessage(
        "End date cannot be earlier than start date."
      );

      return;
    }

    /* -------------------------------------------------------
       REASON VALIDATION
    ------------------------------------------------------- */

    if (reason.length < 5) {
      setMessageType("error");

      setMessage(
        "Please enter a reason with at least 5 characters."
      );

      return;
    }

    if (reason.length > 500) {
      setMessageType("error");

      setMessage(
        "Reason cannot contain more than 500 characters."
      );

      return;
    }

    /* -------------------------------------------------------
       TOKEN CHECK
    ------------------------------------------------------- */

    const token = sessionStorage.getItem("token");

    if (!token) {
      handleUnauthorized();
      return;
    }

    /* -------------------------------------------------------
       SEND REQUEST
    ------------------------------------------------------- */

    try {
      setLoading(true);
      setMessage("");

        const response = await api.post(
          "/leaves",
          {
            leaveType,
            startDate,
            endDate: actualEndDate,
            reason,
            durationType,
            halfDaySession,
            totalDays: finalDuration,
          },
          getAuthConfig()
        );      console.log(
        "APPLY LEAVE RESPONSE:",
        response.data
      );
      setMessageType("success");

      setMessage(
        response.data?.message ||
          "Leave request submitted successfully."
      );

      // Stop the submit button immediately
      setLoading(false);

      // Clear the form after successful submission
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
        durationType: "Full Day",
        halfDaySession: "",
      });
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });

      /*
        Fetch fresh profile again.

        Refresh the balance reserved by the submitted request.
      */

      try {
        const profileResponse = await api.get(
          "/users/profile",
          getAuthConfig()
        );

        const updatedProfile =
          profileResponse.data?.user ||
          profileResponse.data;

        if (updatedProfile) {
          setUser(updatedProfile);

          sessionStorage.setItem(
            "user",
            JSON.stringify(updatedProfile)
          );
        }

        const currentYear = new Date().getFullYear();
        const yearlyBalanceResponse = await api.get(
          `/yearly-leave-balances/my?year=${currentYear}`,
          getAuthConfig()
        );

        setYearlyBalance(
          yearlyBalanceResponse.data?.balance || null
        );
      } catch (profileError) {
        console.error(
          "PROFILE REFRESH ERROR:",
          profileError
        );
      }

      setTimeout(() => {
        navigate("/leave-history");
      }, 1500);
    } catch (error) {
      console.error("APPLY LEAVE ERROR:", error);

      setMessageType("error");

      if (!error.response) {
        setMessage(
          "Cannot connect to the server. Make sure your backend is running."
        );
      } else if (
        error.response.status === 401 ||
        error.response.status === 403
      ) {
        handleUnauthorized();
      } else {
        setMessage(
          error.response?.data?.message ||
            "Unable to submit your leave request."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PAGE VALUES
  ========================================================= */

  const todayDate = getTodayDate();

  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="apply-leave-page">
      <div className="apply-leave-container">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <header className="apply-leave-header">

          <div className="apply-leave-header-content">

            <span className="apply-leave-label">
              📝 Employee Workspace
            </span>

            <h1 className="apply-leave-title">
              Apply for Leave
            </h1>

            <p className="apply-leave-description">
              Submit a leave request, review your current
              leave balance, and see the estimated paid and
              unpaid portions before submitting.
            </p>

          </div>


          <button
            type="button"
            className="apply-leave-back-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>

        </header>


        <div className="apply-leave-grid">


          {/* ===================================================
              FORM PANEL
          =================================================== */}

          <section className="apply-leave-panel">

            <div className="apply-leave-panel-header">

              <h2 className="apply-leave-panel-title">
                Leave Application
              </h2>

              <p className="apply-leave-panel-subtitle">
                Complete all required fields before
                submitting your request.
              </p>

            </div>


            <form
              className="apply-leave-form"
              onSubmit={handleSubmit}
            >

              {message && (

                <div
                  className={`apply-leave-message ${messageType}`}
                >
                  {message}
                </div>

              )}


              {/* LEAVE TYPE */}

              <div className="apply-leave-form-group">

                <label htmlFor="leaveType">
                  Leave Type

                  <span className="apply-leave-required">
                    *
                  </span>
                </label>


                <div className="apply-leave-input-wrapper">

                  <span className="apply-leave-input-icon">
                    📋
                  </span>


                  <select
                    id="leaveType"
                    name="leaveType"
                    value={formData.leaveType}
                    onChange={handleChange}
                    disabled={loading || profileLoading}
                  >

                    <option value="">
                      Select leave type
                    </option>


              {availableLeaveTypes.map((leaveType) => (
                      <option
                        key={leaveType.value}
                        value={leaveType.value}
                      >
                        {leaveType.label}
                      </option>

                    ))}

                  </select>

                </div>

              </div>
              
              {/* DURATION TYPE */}

<div className="apply-leave-form-group">

  <label htmlFor="durationType">
    Leave Duration
  </label>

  <div className="apply-leave-input-wrapper">

    <span className="apply-leave-input-icon">
      ⏱️
    </span>

    <select
      id="durationType"
      name="durationType"
      value={formData.durationType}
      onChange={handleChange}
      disabled={loading}
    >
      <option value="Full Day">
        Full Day
      </option>

      <option value="Half Day">
        Half Day
      </option>
    </select>

  </div>

</div>

          {/* HALF DAY SESSION */}

          {formData.durationType === "Half Day" && (
            <div className="apply-leave-form-group">

              <label htmlFor="halfDaySession">
                Half Day Session
                <span className="apply-leave-required">
                  *
                </span>
              </label>

              <div className="apply-leave-input-wrapper">

                <span className="apply-leave-input-icon">
                  🕐
                </span>

                <select
                  id="halfDaySession"
                  name="halfDaySession"
                  value={formData.halfDaySession}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">
                    Select session
                  </option>

                  <option value="First Half">
                    First Half
                  </option>

                  <option value="Second Half">
                    Second Half
                  </option>
                </select>

              </div>

            </div>
          )}


{/* DATE ROW */}

<div className="apply-leave-form-row">

  {/* START DATE / LEAVE DATE */}

  <div className="apply-leave-form-group">

    <label htmlFor="startDate">

      {formData.durationType === "Half Day"
        ? "Leave Date"
        : "Start Date"}

      <span className="apply-leave-required">
        *
      </span>

    </label>

    <div className="apply-leave-input-wrapper">

      <span className="apply-leave-input-icon">
        📅
      </span>

      <input
        id="startDate"
        type="date"
        name="startDate"
        value={formData.startDate}
        onChange={handleChange}
        min={todayDate}
        disabled={loading}
      />

    </div>

  </div>


  {/* END DATE — FULL DAY ONLY */}

  {formData.durationType === "Full Day" && (

    <div className="apply-leave-form-group">

      <label htmlFor="endDate">

        End Date

        <span className="apply-leave-required">
          *
        </span>

      </label>

      <div className="apply-leave-input-wrapper">

        <span className="apply-leave-input-icon">
          📅
        </span>

        <input
          id="endDate"
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          min={
            formData.startDate ||
            todayDate
          }
          disabled={loading}
        />

      </div>

    </div>

  )}

</div>

              {/* LEAVE PREVIEW */}

              <div className="apply-leave-duration-box">

                <span className="apply-leave-duration-label">
                  Requested Duration
                </span>

                <span className="apply-leave-duration-value">
                    {finalDuration > 0
                      ? `${finalDuration} ${
                          finalDuration === 1
                            ? "Day"
                            : "Days"
                        }`
                      : "Select dates"}
                  </span>
              </div>


              {formData.leaveType && duration > 0 && (

                <div className="apply-leave-balance-preview">


                  <div className="apply-leave-preview-item">

                    <span className="apply-leave-preview-label">
                      Available Balance
                    </span>

                    <strong className="apply-leave-preview-value">
                      {formData.leaveType ===
                      "Leave Without Pay"
                        ? "Not Applicable"
                        : `${availableBalance} Days`}
                    </strong>

                  </div>


                  <div className="apply-leave-preview-item">

                    <span className="apply-leave-preview-label">
                      Estimated Paid Days
                    </span>

                    <strong className="apply-leave-preview-value paid">
                      {estimatedPaidDays} Days
                    </strong>

                  </div>


                  <div className="apply-leave-preview-item">

                    <span className="apply-leave-preview-label">
                      Estimated Unpaid Days
                    </span>

                    <strong className="apply-leave-preview-value unpaid">
                      {estimatedUnpaidDays} Days
                    </strong>

                  </div>

                </div>

              )}


              <p className="apply-leave-preview-note">
                Paid and unpaid days shown here are estimates.
                The backend calculates the final values when
                the request is submitted and approved.
              </p>
           {formData.leaveType &&
 duration > 0 &&
 formData.leaveType !== "Leave Without Pay" &&
 availableBalance <= 0 && (

  <div className="apply-leave-warning">

    ⚠️ You have no remaining
    <strong> {formData.leaveType} Leave </strong>
    balance.

    <br /><br />

    Please contact the administrator or apply for
    <strong> Leave Without Pay</strong>.

  </div>

)}

              {/* REASON */}

              <div className="apply-leave-form-group">

                <label htmlFor="reason">
                  Reason for Leave

                  <span className="apply-leave-required">
                    *
                  </span>
                </label>


                <div className="apply-leave-textarea-wrapper">

                  <span className="apply-leave-textarea-icon">
                    ✍
                  </span>


                  <textarea
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Briefly explain the reason for your leave request..."
                    maxLength={500}
                    disabled={loading}
                  />

                </div>


                <span className="apply-leave-character-count">
                  {formData.reason.length}/500 characters
                </span>

              </div>


              {/* BUTTONS */}

              <div className="apply-leave-form-actions">

                <button
                  type="button"
                  className="apply-leave-cancel-btn"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="apply-leave-submit-btn"
                 disabled={
  loading ||
  profileLoading ||
  !user ||
  (
    formData.leaveType !== "Leave Without Pay" &&
    formData.leaveType &&
    availableBalance <= 0
  )
}
                >

                  {loading
                    ? "Submitting..."
                    : profileLoading
                    ? "Loading Balances..."
                    : "Submit Leave Request"}

                  {!loading && !profileLoading && (
                    <span>→</span>
                  )}

                </button>

              </div>

            </form>

          </section>


          {/* ===================================================
              RIGHT SIDEBAR
          =================================================== */}

          <aside className="apply-leave-sidebar">


            {/* EMPLOYEE INFORMATION */}

            <section className="apply-leave-panel">

              <div className="apply-leave-panel-header">

                <h2 className="apply-leave-panel-title">
                  Employee Information
                </h2>

                <p className="apply-leave-panel-subtitle">
                  Current employee and leave balances details.
                </p>

              </div>


              <div className="apply-leave-user-content">


                <div className="apply-leave-user-top">

                  <div className="apply-leave-user-avatar">
                    {getInitials(user?.name)}
                  </div>


                  <div className="apply-leave-user-info">

                    <span className="apply-leave-user-name">
                      {profileLoading
                        ? "Loading..."
                        : user?.name ||
                          "Employee"}
                    </span>


                    <span className="apply-leave-user-email">
                      {user?.email ||
                        "Email unavailable"}
                    </span>

                  </div>

                </div>


                <div className="apply-leave-user-details">


                  <div className="apply-leave-user-detail">

                    <span className="apply-leave-user-detail-label">
                      Role
                    </span>

                    <span className="apply-leave-user-detail-value">
                      {user?.role || "employee"}
                    </span>

                  </div>


                  <div className="apply-leave-user-detail">

                    <span className="apply-leave-user-detail-label">
                      Leave Type
                    </span>

                    <span className="apply-leave-user-detail-value">
                      {formData.leaveType ||
                        "Not selected"}
                    </span>

                  </div>


                  <div className="apply-leave-user-detail">

                    <span className="apply-leave-user-detail-label">
                      Current Balance
                    </span>

                    <span className="apply-leave-user-detail-value">

                      {!formData.leaveType
                        ? "-"
                        : formData.leaveType ===
                          "Leave Without Pay"
                        ? "N/A"
                        : `${availableBalance} days`}

                    </span>

                  </div>


                  <div className="apply-leave-user-detail">

                    <span className="apply-leave-user-detail-label">
                      Duration
                    </span>

                    <span className="apply-leave-user-detail-value">
                      {duration > 0
                        ? `${duration} ${
                            duration === 1
                              ? "day"
                              : "days"
                          }`
                        : "-"}
                    </span>

                  </div>


                  <div className="apply-leave-user-detail">

                    <span className="apply-leave-user-detail-label">
                      Paid / Unpaid
                    </span>

                    <span className="apply-leave-user-detail-value">
                      {duration > 0
                        ? `${estimatedPaidDays} / ${estimatedUnpaidDays}`
                        : "-"}
                    </span>

                  </div>

                </div>

              </div>

            </section>


            {/* GUIDELINES */}

            <section className="apply-leave-panel">

              <div className="apply-leave-panel-header">

                <h2 className="apply-leave-panel-title">
                  Before You Submit
                </h2>

                <p className="apply-leave-panel-subtitle">
                  Review these guidelines before applying.
                </p>

              </div>


              <div className="apply-leave-guidelines">


                <div className="apply-leave-guideline-item">

                  <span className="apply-leave-guideline-icon">
                    1
                  </span>

                  <span className="apply-leave-guideline-content">

                    <span className="apply-leave-guideline-title">
                      Check Your Balance
                    </span>

                    <span className="apply-leave-guideline-description">
                      Review the available paid leave balances
                      and estimated unpaid days before
                      submitting.
                    </span>

                  </span>

                </div>


                <div className="apply-leave-guideline-item">

                  <span className="apply-leave-guideline-icon">
                    2
                  </span>

                  <span className="apply-leave-guideline-content">

                    <span className="apply-leave-guideline-title">
                      Provide a Clear Reason
                    </span>

                    <span className="apply-leave-guideline-description">
                      Give enough information for the
                      administrator to review your request.
                    </span>

                  </span>

                </div>


                <div className="apply-leave-guideline-item">

                  <span className="apply-leave-guideline-icon">
                    3
                  </span>

                  <span className="apply-leave-guideline-content">

                    <span className="apply-leave-guideline-title">
                      Track Admin Decision
                    </span>

                    <span className="apply-leave-guideline-description">
                      Open Leave History after submission to
                      track approval status and final paid or
                      unpaid leave allocation.
                    </span>

                  </span>

                </div>

              </div>

            </section>

          </aside>

        </div>

      </div>
    </div>
  );
}

export default ApplyLeave;
