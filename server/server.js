const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables FIRST
dotenv.config();

const sendEmail = require("./utils/sendEmail");

const connectDB = require("./config/db");

const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./routes/authRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const hrRoutes = require("./routes/hrRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const seedHolidays = require("./seed/holidaySeeder");
const leaveCarryForwardRoutes =
  require(
    "./routes/leaveCarryForwardRoutes"
  );
const yearlyLeaveBalanceRoutes =
  require(
    "./routes/yearlyLeaveBalanceRoutes"
  );
console.log("seedHolidays =", seedHolidays);

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");
console.log("Report Routes Loaded Successfully");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test Route
app.get("/", (req, res) => {
  res.send("Leave Management System Backend is Running...");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/leave-carry-forward",leaveCarryForwardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/yearly-leave-balances",yearlyLeaveBalanceRoutes);

const PORT = process.env.PORT || 5000;

// Shared startup work for local development and the Vercel function.
const initializeApp = async () => {
  await connectDB();
  await seedHolidays();
};

// Connect Database and Start Server locally. Vercel imports the Express app
// through api/index.js and must not start a separate listening server.
const startServer = async () => {
  try {
    await initializeApp();

    app.listen(PORT, async () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:");
    console.error(error);
  }
};

if (process.env.VERCEL !== "1") {
  startServer();
}

module.exports = { app, initializeApp };
