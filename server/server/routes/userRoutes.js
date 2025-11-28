const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const appointments = require("../model/userSchema");

// Load .env
require("dotenv").config();

// 🧠 OTP Store (Temporary)
let otpStore = {};


// ------------------------
// ✅ TEST ROUTES
// ------------------------
router.get("/send-otp", (req, res) => {
  res.send("✅ Send OTP API is working...");
});

router.get("/verify-otp", (req, res) => {
  res.send("✅ Verify OTP API is working...");
});

router.get("/appointments", (req, res) => {
  res.send("✅ Appointment API is working...");
});



// ------------------------
// ✅ SEND OTP (POST)
// ------------------------
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Nandini’s Make-Over 💄" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "✨ OTP Verification for Appointment",
    html: `
      <div style="font-family: Poppins, sans-serif; background: #fff0f6; padding: 20px;">
        <h2 style="color: #e91e63; text-align: center;">💅 Nandini's Make-Over Studio</h2>
        <p>Your OTP is:</p>
        <h1 style="background:#e91e63; color:#fff; padding:15px; text-align:center;">${otp}</h1>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
      error: error.message,
    });
  }
});


// ------------------------
// ✅ VERIFY OTP (POST)
// ------------------------
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  const storedOtp = otpStore[email];

  if (!storedOtp) {
    return res
      .status(400)
      .json({ success: false, message: "OTP expired or not generated" });
  }

  if (parseInt(otp) === storedOtp) {
    delete otpStore[email];
    return res.json({ success: true, message: "OTP verified successfully!" });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Invalid OTP. Please try again." });
  }
});



// ------------------------
// ✅ CREATE APPOINTMENT (POST)
// ------------------------
router.post("/appointments", async (req, res) => {
  try {
    const { name, email, phone, service, date, message } = req.body;

    if (!name || !email || !phone || !service || !date) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields must be provided" });
    }

    const appointment = new appointments(req.body);
    const data = await appointment.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    });

    // User confirmation mail
    const userMail = {
      from: `"Nandini’s Make-Over 💅" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "🎉 Appointment Confirmed Successfully!",
      html: `
          <h2>Your Appointment is Confirmed!</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Service:</b> ${service}</p>
          <p><b>Date:</b> ${date}</p>
      `,
    };

    // Admin notification
    const adminMail = {
      from: `"Nandini’s Make-Over 💅" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: "🆕 New Appointment Booked!",
      html: `
          <h2>New Appointment Details</h2>
          <p><b>Name:</b> ${name}</p>
          <p><b>Email:</b> ${email}</p>
          <p><b>Service:</b> ${service}</p>
          <p><b>Date:</b> ${date}</p>
      `,
    };

    await transporter.sendMail(userMail);
    await transporter.sendMail(adminMail);

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully!",
      data,
    });
  } catch (err) {
    console.error("Appointment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create appointment.",
      error: err.message,
    });
  }
});

module.exports = router;
