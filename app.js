const express = require('express')
const app = express()
const mongoose = require('mongoose');
const path = require('path');
const uri = 'mongodb://localhost:27017/bookClubApp';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

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
})

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
    bookIssued: {
        type: Object,
        default: null,
    },
});

const userModel = mongoose.model('user', userSchema);

app.get('/', (req, res) => {
    res.render('index');
})

//------------------------------------- Log In --------------------------------------------------

app.route('/login')
    .get( (req, res) => {
        res.render('login', { err: null });
    })
    .post( async (req, res) => {
        const { email, password } = req.body;
        const user = await userModel.findOne({
            usermail: email,
            userpasswd: password,
        });
        if (user) {
            res.redirect(`/home/${user._id}`);
        }
        else {
            res.render('login', { err: 'Invalid Email or Password !!!' })
        }
    });

// --------------------------------- Register ------------------------------------------------
app.route('/register')
    .get( (req, res) => {
        res.render('register', { err: null });
    })
    .post( async (req, res) => {
        const { username, password, email } = req.body;
        if (username && password && email) {
            const check = await userModel.findOne({
                usermail: email,
            })
            if (check) {
                res.render('register', { err: 'User with this Email already exist.' })
            }
            else {
                const user = await userModel.create({
                    username: username,
                    userpasswd: password,
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
    .get( (req, res) => {
        res.render('reset', { err: null });
    })
    .post( async (req, res) => {
        const { username, password, email } = req.body;
        const user = await userModel.findOne({
            username: username,
            usermail: email,
        })
        if (user) {
            await userModel.findOneAndUpdate(user, {
                userpasswd: password,
            })
            res.render('reset', { err: 'Password Updated Successfully, Login Now!' })
        }
        else {
            res.render('reset', { err: 'Cannot find any user with this Name and Email' });
        }
    });

// ---------------------------------- Log Out ---------------------------------------------------

app.route('/logout')
    .get((req,res)=>{
        res.render('index')
    })

// ----------------------------------- Homepage -----------------------------------------------

app.get('/home/:id', async (req, res) => {
    const books = await bookModel.find();
    const user = await userModel.findById(req.params.id)
    res.render('home', {user, books, err:null})
})

// app.post('/home', async (req,res)=>{
//     const
// })

// ----------------------------------------- Book Rent ---------------------------------------

app.get('/home/rent/:userId/:bookId', async (req, res) => {
    // const { bookId, userId } = req.body;
    const book = await bookModel.findById(req.params.bookId);
    const user = await userModel.findById(req.params.userId);
    if (book.isIssued) {
        const books = await bookModel.find();
        res.render('home', {user, books, id: book._id, err: 'Book is Already Issued to a User!' })
    }
    else {
        await bookModel.findOneAndUpdate(book, {
            isIssued: true,
            isIssuedTo: user,
        })
        res.render('rentSuccess', {user,book})
    }
    // console.log(book);
})

// ------------------------------------- My Books -----------------------------

app.route('/mybooks/:id')
    .get( async (req,res)=>{
        const user = await userModel.findById(req.params.id);
        const books  =await bookModel.find();
        res.render('mybooks', {user, books});
    })

// ------------------------------------ Return Book -----------------------------------

app.route('/mybooks/return/:userId/:bookId')
    .get( async(req,res)=>{
        const user = await userModel.findById(req.params.userId);
        const book = await bookModel.findById(req.params.bookId);
        await bookModel.findOneAndUpdate(book ,{
            isIssued: false,
            isIssuedTo:null,
        })
        res.render('returnSuccess', {user,book})
    })


// ---------------------------------- Book Search Functionality ---------------------------------

app.get('/search/:id', async (req,res)=>{
    const user = await userModel.findById(req.params.id);
    var {q} = (req.query);
    q = q.toLowerCase();

    console.log(q);
    // var books = []
    const allbooks = await bookModel.find()
    let books = [];

    if (q) {
        allbooks.forEach(book => {
            if (book.bookName.toLowerCase().includes(q) || book.bookAuthor.toLowerCase().includes(q) || book.bookPublisher.toLowerCase().includes(q)){
                books.push(book);
            }
        });
        res.render('home', {user,books, err:null});
    }

    // searchInput.addEventListener('keyup', (event) => {
    //     const searchTerm = event.target.value.toLowerCase();
    //     books.forEach(book => {
    //         const bookName = book.bookName.toLowerCase();
    //         const bookAuthor = book.bookAuthor.toLowerCase();
    //         const bookPublisher = book.bookPublisher.toLowerCase();
    //         if (bookName.includes(searchTerm) || bookAuthor.includes(searchTerm) || bookPublisher.includes(searchTerm)) {
    //             filteredBooks = filteredBooks.push(book);
    //         }
    //     });
    //     res.render('home',{filteredBooks})
    // });

})

app.listen(4000, () => {
    console.log('App running on port: 4000');
});

