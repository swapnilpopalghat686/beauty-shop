const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const appointments = require("../model/userSchema");

// 🧠 Temporary OTP store (dev only)
let otpStore = {};

// Test route
router.get("/appointments", (req, res) => {
  res.send("✅ Appointment API is working...");
});

// SEND OTP
router.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required to send OTP",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  otpStore[email] = otp;

  // CORRECT: env variables used
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
      <div style="font-family: Poppins, sans-serif; background: #fff0f6; padding: 20px; border-radius: 10px; border: 1px solid #f8bbd0;">
        <h2 style="color: #e91e63; text-align: center;">💅 Nandini's Make-Over Studio</h2>
        <p>Use the OTP below to verify your booking.</p>
        <h1 style="background:#e91e63; color:#fff; padding:15px; text-align:center; border-radius:8px; letter-spacing:5px;">${otp}</h1>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({
      success: true,
      message: "OTP sent successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send OTP.",
      error: error.message,
    });
  }
});

// VERIFY OTP
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  if (parseInt(otp) === otpStore[email]) {
    delete otpStore[email];
    return res.json({
      success: true,
      message: "OTP verified successfully!",
    });
  }

  res.status(400).json({
    success: false,
    message: "Invalid OTP. Please try again.",
  });
});

// CREATE APPOINTMENT
router.post("/appointments", async (req, res) => {
  try {
    const { name, email, phone, service, date, message } = req.body;

    if (!name || !email || !phone || !service || !date) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const result = new appointments(req.body);
    const data = await result.save();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
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
        <h2>New Appointment</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Service:</b> ${service}</p>
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
    return res.status(500).json({
      success: false,
      message: "Failed to create appointment.",
      error: err.message,
    });
  }
});

module.exports = router;
