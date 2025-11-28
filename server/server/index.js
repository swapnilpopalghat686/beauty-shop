const express = require('express')
const app = express()

const HOST = '0.0.0.0'
const PORT = 1000 || process.env.PORT

// middleware
app.use(express.static('public/'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())


// ******************************************************

// cors
var cors = require('cors')

// all origin
app.use(cors())

// specific origin
// app.use({origin:'http://localhost:5173/'})

// ******************************************************

// dotenv
const dotenv = require('dotenv')
dotenv.config()


const session = require('express-session')

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
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      secure: false // Render HTTPS असेल तर true kar
    }
  })
);

// multer
const multer = require('multer')

// const storage=multer.diskStorage({
//     destination:'',
//     filename:''
// })
// const upload=multer({storage:storage})


// password hashing
const bcrypt = require('bcryptjs');

// ****************************************

// db connection
const connection = require('./config/db')
const users = require('./model/userSchema')


// ************************************************8

const userRoutes = require('./routes/userRoutes')
app.use('/', userRoutes)

const adminRoutes = require('./routes/adminRoutes')
app.use('/admin', adminRoutes)

app.get('/', (req, res) => {
    res.send("Server is running......✅")
})



app.listen(PORT, HOST, () => {
    console.log(`Server is up on http://${HOST}:${PORT}`)
})