const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

// PORT + HOST
const HOST = '0.0.0.0';
const PORT = process.env.PORT || 1000;

// Middlewares
// CORRECTED
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/'));


// CORS
const cors = require('cors');
app.use(cors());

// Session + Mongo Store
const session = require('express-session');
const MongoStore = require("connect-mongo");

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.CONNECTION_STRING,
      ttl: 24 * 60 * 60, // 1 day
    }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" // Render वर auto true
    }
  })
);

// DB
require('./config/db');

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);

// Default route
app.get('/', (req, res) => {
  res.send("Server is running......✅");
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
