const nodemailer = require("nodemailer");

/* =========================================================
   CREATE TRANSPORTER
========================================================= */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* =========================================================
   SEND EMAIL
========================================================= */

const sendEmail = async (to, subject, html) => {
  console.log("========================================");
  console.log("📧 Sending Email");
  console.log("From:", process.env.EMAIL_USER);
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("========================================");

  try {
    const info = await transporter.sendMail({
      from: `"Leave Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email Sent Successfully");
    console.log(info.response);

    return info;
  } catch (error) {
    console.error("❌ EMAIL SENDING FAILED");
    console.error(error);

    throw error;
  }
};

/* =========================================================
   EXPORT
========================================================= */

module.exports = sendEmail;