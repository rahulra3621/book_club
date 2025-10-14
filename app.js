const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookie_parser = require('cookie-parser')
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const uri = 'mongodb+srv://rahulrajput3621_db_user:Rahul%40mongo123@todo.fntphjl.mongodb.net/bookClub';
const SECRET_KEY = "JWT_SECRET_KEY";


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use(cookie_parser());



app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error Connecting to MongoDB', err));

const bookSchema = new mongoose.Schema({
    bookName: {
        type: String,
        required: true,
    },
    bookAuthor: {
        type: String,
        required: true,
    },
    bookPublisher: {
        type: String,
        required: true,
    },
    bookPrice: {
        type: Number,
        required: true,
    },
    isIssued: {
        type: Boolean,
        required: true,
        default: false,
    },
    isIssuedTo: {
        type: mongoose.Schema.ObjectId,
        default: null,
    }
});
const bookModel = mongoose.model('book', bookSchema);

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
    },
    userpasswd: {
        type: String,
        required: true,
        minlength: 6,
    },
    usermail: {
        type: String,
        required: true,
    },
    userwallet: {
        type: Number,
        default: 0,
    },
    bookIssued: {
        type: Object,
        default: null,
    },
});
const userModel = mongoose.model('user', userSchema);

// ---------------------------------- AuthMiddleware Functionality -------------------------------

function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token;
        if (!token) return res.redirect('/login');

        const verifiedUser = jwt.verify(token, SECRET_KEY);
        req.id = verifiedUser.id;
        next();
    } catch (err) {
        console.error('JWT Error:', err.message);
        return res.clearCookie('token').redirect('/login');
    }
}


app.get('/', (req, res) => {
    res.render('index');
})

//------------------------------------- Log In --------------------------------------------------

app.route('/login')
    .get((req, res) => {
        let err = req.cookies.err;
        res.render('login', { err });
    })
    .post(async (req, res) => {
        const { email, password } = req.body;
        const user = await userModel.findOne({
            usermail: email,
        });
        if (!user) {
            res.render('login', { err: 'User Not Found!' })
        }
        else {
            const validPassword = await bcrypt.compare(password, user.userpasswd);
            if (!validPassword) {
                res.render('login', { err: 'Invalid Credentials !!!' })
            }
            else {
                const token = await jwt.sign({ id: user._id }, SECRET_KEY);
                res.cookie('token', token, { httpOnly: true })
                res.redirect(`/home`);
            }
        }

    });

// --------------------------------- Register ------------------------------------------------

app.route('/register')
    .get((req, res) => {
        res.render('register', { err: null });
    })
    .post(async (req, res) => {
        const { username, password, email } = req.body;
        if (username && password && email) {
            const hashedPassword = await bcrypt.hash(password, 5);
            const check = await userModel.findOne({
                usermail: email,
            })
            if (check) {
                res.render('register', { err: 'User with this Email already exist.' })
            }
            else {
                const user = await userModel.create({
                    username: username,
                    userpasswd: hashedPassword,
                    usermail: email,
                })
                console.log(user);
                res.redirect('/login')
            }
        }
        else {
            res.render('register', { err: 'All fields are required !!!' })
        }
    });

// ---------------------------------- Reset password ---------------------------------------

app.route('/reset')
    .get((req, res) => {
        res.render('reset', { err: null });
    })
    .post(async (req, res) => {
        const { username, password, email } = req.body;
        const user = await userModel.findOne({
            username: username,
            usermail: email,
        })
        if (user) {
            const hashedPassword = await bcrypt.hash(password, 5);
            await userModel.findOneAndUpdate(user, {
                userpasswd: hashedPassword,
            })
            res.render('reset', { err: 'Password reset successfully!!' })
        }
        else {
            res.render('reset', { err: 'Cannot find any user with this Name and Email' });
        }
    });



// -------------------------- Auth Middleware for JWT Authentication ------------------------------------

app.use(authMiddleware);


// ---------------------------------- Log Out ---------------------------------------------------

app.route('/logout')
    .get((req, res) => {
        res.cookie('token', null)
        res.render('index')
    });


// ----------------------------------- Homepage -----------------------------------------------

app.get('/home', async (req, res) => {
    const books = await bookModel.find();
    const user = await userModel.findById(req.id)
    res.render('home', { user, books, err: null })
});

// ------------------------------------- Profile ---------------------------------------------------

app.get('/profile', async (req, res) => {
    const user = await userModel.findById(req.id);
    res.render('profile', { user })
});

// ----------------------------------------- Book Rent ---------------------------------------

app.get('/home/rent/:bookId', async (req, res) => {
    const book = await bookModel.findById(req.params.bookId);
    const user = await userModel.findById(req.id);
    if (book.isIssued) {
        const books = await bookModel.find();
        res.render('home', { user, books, id: book._id, err: 'Book is Already Issued to a User!' })
    }
    else {
        res.render('checkout', { user, book });
    }
})

// ----------------------------------------------- Checkout ------------------------------------------------------

app.get('/checkout/:bookId', async (req, res) => {
    const user = await userModel.findById(req.id);
    const book = await bookModel.findById(req.params.bookId);
    if (user.userwallet >= book.bookPrice) {
        await bookModel.findOneAndUpdate(book, {
            isIssued: true,
            isIssuedTo: user,
        });
        const newAmount = (user.userwallet) - (book.bookPrice);
        await userModel.findOneAndUpdate(user, {
            userwallet: newAmount,
        })
        res.render('rentSuccess', { user, book });
    }
    else {
        res.render('recharge', { user, err: "Insufficient Amount! Please Recharge First." })
    }
});

// ------------------------------------- My Books -----------------------------

app.route('/mybooks')
    .get(async (req, res) => {
        const user = await userModel.findById(req.id);
        const books = await bookModel.find();
        res.render('mybooks', { user, books });
    })

// ------------------------------------ Return Book -----------------------------------

app.route('/mybooks/return/:bookId')
    .get(async (req, res) => {
        const user = await userModel.findById(req.id);
        const book = await bookModel.findById(req.params.bookId);
        const newAmount = (user.userwallet) + ((book.bookPrice) - (book.bookPrice) / 10);
        await bookModel.findOneAndUpdate(book, {
            isIssued: false,
            isIssuedTo: null,
        });
        await userModel.findOneAndUpdate(user, {
            userwallet: newAmount,
        });
        res.render('returnSuccess', { user, book })
    })


// ---------------------------------- Book Search Functionality ---------------------------------

app.get('/search', async (req, res) => {
    const user = await userModel.findById(req.id);
    var { q } = (req.query);
    q = q.toLowerCase();

    console.log(q);
    const allbooks = await bookModel.find()
    let books = [];

    if (q) {
        allbooks.forEach(book => {
            if (book.bookName.toLowerCase().includes(q) || book.bookAuthor.toLowerCase().includes(q) || book.bookPublisher.toLowerCase().includes(q)) {
                books.push(book);
            }
        });
        res.render('home', { user, books, err: null });
    }

});


// -------------------------------------------- Recharge ---------------------------------------------------------------
app.route('/recharge')
    .get(async (req, res) => {
        const user = await userModel.findById(req.id);
        res.render('recharge', { user, err: null });
    })
    .post(async (req, res) => {
        const { credit } = req.body;
        const user = await userModel.findByIdAndUpdate(req.id);
        const newAmount = (user.userwallet) + Number(credit);
        await userModel.findOneAndUpdate(user, {
            userwallet: newAmount,
        });
        res.redirect('/profile');


    });


// ----------------------------------- App Listener ----------------------------------------------------------------------

app.listen(4000, () => {
    console.log('App running on port: 4000');
});

