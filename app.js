require('dotenv').config();
const express = require('express');
const userRouter = require('./routes/userRouter');
const bookRouter = require('./routes/bookRouter');
const authMiddleware = require('./middleware/authMiddleware')
const cookie_parser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const uri = process.env.MONGO_URI;



app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(cookie_parser());



app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// ------------------------------ Connection with MongoDB ----------------------------------

mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error Connecting to MongoDB', err));


// ------------------------------------ Index Route -----------------------------------------

app.get('/', (req, res) => {
    res.render('index');
})

// --------------------------------- User Router -----------------------------------------------

app.use('/',userRouter);

// -------------------------- Auth Middleware for JWT Authentication ------------------------------------

app.use(authMiddleware);

// --------------------------- Book Router ----------------------------------------------------

app.use('/',bookRouter)

// ----------------------------------- App Listener ----------------------------------------------------------------------

app.listen(4000, () => {
    console.log('App running on port: 4000');
});

