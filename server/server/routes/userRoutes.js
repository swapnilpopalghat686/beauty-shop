const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const users = require("../model/userSchema");


// 🧠 Temporary OTP store (later you can move this to MongoDB)
let otpStore = {};

// ✅ Test route
router.get("/appointments", (req, res) => {
  res.send("✅ Appointment API is working...");
});

// ✅ Send OTP route
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

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nandinikadam631@gmail.com", // your gmail
      pass: "qjqy sksd vrrq jgls", // your app password
    },
  });

  const mailOptions = {
    from: '"Nandini’s Make-Over 💄" <nandinikadam631@gmail.com>',
    to: email,
    subject: "✨ OTP Verification for Appointment",
    html: `
      <div style="font-family: Poppins, sans-serif; background: #fff0f6; padding: 20px; border-radius: 10px; border: 1px solid #f8bbd0;">
        <h2 style="color: #e91e63; text-align: center;">💅 Nandini's Make-Over Studio</h2>
        <p style="font-size: 15px; color: #444;">Thank you for choosing us! Use the OTP below to verify your booking.</p>
        <h1 style="background:#e91e63; color:#fff; padding:15px; text-align:center; border-radius:8px; letter-spacing:5px;">${otp}</h1>
        <p style="color: #555;">This OTP is valid for <b>5 minutes</b>. Do not share it with anyone.</p>
        <hr style="margin:20px 0; border:none; border-top:1px solid #eee;" />
        <p style="font-size:13px; color:#999;">If you didn’t request this, ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({
      success: true,
      message: "OTP sent successfully to your email!",
    });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

// ✅ Verify OTP route
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
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid OTP. Please try again.",
    });
  }
});

// ✅ Create Appointment + Send Confirmation (to user + admin)
router.post("/appointments", async (req, res) => {
  try {
    const { name, email, phone, service, date, message } = req.body;

    if (!name || !email || !phone || !service || !date) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Save appointment to DB
    const result = new users(req.body);
    const data = await result.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "nandinikadam631@gmail.com",
        pass: "qjqy sksd vrrq jgls",
      },
    });

    // 📩 Confirmation Mail to User
    const userMail = {
      from: '"Nandini’s Make-Over 💅" <nandinikadam631@gmail.com>',
      to: email,
      subject: "🎉 Appointment Confirmed Successfully!",
      html: `
        <div style="font-family: Poppins, sans-serif; background-color: #fff5f8; padding: 20px; border-radius: 12px; border: 1px solid #f8bbd0;">
          <h2 style="color: #e91e63; text-align:center;">💄 Appointment Confirmed!</h2>
          <p style="font-size:15px; color:#333;">Dear <b>${name}</b>,</p>
          <p>We’re delighted to confirm your appointment. Here are your details:</p>
          <ul style="line-height:1.8; color:#444;">
            <li><b>Service:</b> ${service}</li>
            <li><b>Date:</b> ${date}</li>
            <li><b>Phone:</b> ${phone}</li>
            <li><b>Message:</b> ${message || "N/A"}</li>
          </ul>
          <p>We look forward to making your day special at Nandini’s Make-Over Studio 💕</p>
          <p style="margin-top:15px;">With Love,<br><b>Nandini’s Make-Over Team 💄</b></p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #f8bbd0;" />
          <p style="font-size:12px; color:#aaa;">This is an automated confirmation. Please do not reply.</p>
        </div>
      `,
    };

    // 📩 Notification Mail to Admin
    const adminMail = {
      from: '"Nandini’s Make-Over 💅" <nandinikadam631@gmail.com>',
      to: "nandinikadam631@gmail.com", // Admin Email
      subject: "🆕 New Appointment Booked!",
      html: `
        <div style="font-family: Poppins, sans-serif; background:#fff; padding:20px; border-radius:10px; border:1px solid #eee;">
          <h2 style="color:#4CAF50;">📢 New Appointment Alert</h2>
          <p>A new appointment has been booked by a customer:</p>
          <ul style="color:#333;">
            <li><b>Name:</b> ${name}</li>
            <li><b>Email:</b> ${email}</li>
            <li><b>Phone:</b> ${phone}</li>
            <li><b>Service:</b> ${service}</li>
            <li><b>Date:</b> ${date}</li>
            <li><b>Message:</b> ${message || "No message provided"}</li>
          </ul>
          <p style="color:#666; font-size:14px;">Please check your dashboard for more info.</p>
        </div>
      `,
    };

    await transporter.sendMail(userMail);
    await transporter.sendMail(adminMail);

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully! Emails sent to user and admin.",
      data,
    });
  } catch (err) {
    console.error("Error in appointment route:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create appointment or send confirmation email.",
      error: err.message,
    });
  }
});

module.exports = router;
