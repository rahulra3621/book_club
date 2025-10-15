const express = require('express');
const bookModel = require('../models/bookModel');
const userModel = require('../models/userModel');
const bookRouter = express.Router();





// ---------------------------------- Log Out ---------------------------------------------------

bookRouter.route('/logout')
    .get((req, res) => {
        res.cookie('token', null)
        res.render('index')
    });


// ----------------------------------- Homepage -----------------------------------------------

bookRouter.get('/home', async (req, res) => {
    const books = await bookModel.find();
    const user = await userModel.findById(req.id)
    res.render('home', { user, books, err: null })
});

// ------------------------------------- Profile ---------------------------------------------------

bookRouter.get('/profile', async (req, res) => {
    const user = await userModel.findById(req.id);
    res.render('profile', { user })
});

// ----------------------------------------- Book Rent ---------------------------------------

bookRouter.get('/home/rent/:bookId', async (req, res) => {
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

bookRouter.get('/checkout/:bookId', async (req, res) => {
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

bookRouter.route('/mybooks')
    .get(async (req, res) => {
        const user = await userModel.findById(req.id);
        const books = await bookModel.find();
        res.render('mybooks', { user, books });
    })

// ------------------------------------ Return Book -----------------------------------

bookRouter.route('/mybooks/return/:bookId')
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

bookRouter.get('/search', async (req, res) => {
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
bookRouter.route('/recharge')
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

module.exports = bookRouter;