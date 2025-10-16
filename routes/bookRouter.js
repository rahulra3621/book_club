const express = require('express');
const bookModel = require('../models/bookModel');
const userModel = require('../models/userModel');
const bookRouter = express.Router();





// ---------------------------------- Log Out ---------------------------------------------------

bookRouter.route('/logout')
    .get((req, res) => {
        res.cookie('token', null)
        return res.status(200).render('index')
    });


// ----------------------------------- Homepage -----------------------------------------------

bookRouter.get('/home', async (req, res) => {
    const books = await bookModel.find();
    const user = await userModel.findById(req.id)
    let searchInp = null;
    return res.status(200).render('home', { user, books, searchInp, err: null })
});

// ------------------------------------- Profile ---------------------------------------------------

bookRouter.get('/profile', async (req, res) => {
    const user = await userModel.findById(req.id);
    return res.status(200).render('profile', { user })
});

// ----------------------------------------- Book Rent ---------------------------------------

bookRouter.get('/home/rent/:bookId', async (req, res) => {
    const book = await bookModel.findById(req.params.bookId);
    const user = await userModel.findById(req.id);
    if (book.isIssued) {
        const books = await bookModel.find();
        return res.status(403).render('home', { user, books, id: book._id, searchInp:null, err: 'Book is Already Issued to a User!' })
    }
    else {
        return res.status(200).render('checkout', { user, book });
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
        return res.status(200).render('rentSuccess', { user, book });
    }
    else {
        return res.status(402).render('recharge', { user, err: "Insufficient Amount! Please Recharge First." })
    }
});

// ------------------------------------- My Books -----------------------------

bookRouter.route('/mybooks')
    .get(async (req, res) => {
        try {
            const user = await userModel.findById(req.id);
            const books = await bookModel.find();
            return res.status(200).render('mybooks', { user, books });
        }
        catch (e) {
            return res.status(400).render('mybooks', { err: 'Unable to Fetch Books Error: ' + e })
        }
    })

// ------------------------------------ Return Book -----------------------------------

bookRouter.route('/mybooks/return/:bookId')
    .get(async (req, res) => {
        try {
            const user = await userModel.findById(req.id);
            const book = await bookModel.findById(req.params.bookId);
            if (!book) throw ""
            if (book.isIssued == false) {
                return res.render('404', { err: 'Book was not Issued' })
            }
            await bookModel.findOneAndUpdate(book, {
                isIssued: false,
                isIssuedTo: null,
            });
            return res.status(200).render('returnSuccess', { user, book })
        }
        catch (e) {
            return res.status(404).render('404', { err: 'Invalid Book ID' })
        }
    })


// ---------------------------------- Book Search Functionality ---------------------------------

bookRouter.get('/search', async (req, res) => {
    try {
        const user = await userModel.findById(req.id);
        var { q } = (req.query);
        var searchInp = q
        q = q ? q.toLowerCase() : '';

        const allbooks = await bookModel.find()
        let books = [];

        if (q) {
            allbooks.forEach(book => {
                if (book.bookName.toLowerCase().includes(q) || book.bookAuthor.toLowerCase().includes(q) || book.bookPublisher.toLowerCase().includes(q)) {
                    books.push(book);
                }
            });
            if (books.length == 0) {
                return res.status(404).render('home', { user, books, searchInp, err: 'Books Not Found' });
            }
            return res.status(200).render('home', { user, books, searchInp, err: null });
        }
    }
    catch(e){
        return res.status(404).render('404',{ err: e})
    }

});


// -------------------------------------------- Recharge ---------------------------------------------------------------
bookRouter.route('/recharge')
    .get(async (req, res) => {
        const user = await userModel.findById(req.id);
        return res.status(200).render('recharge', { user, err: null });
    })
    .post(async (req, res) => {
        const { credit } = req.body;
        const user = await userModel.findByIdAndUpdate(req.id);
        const newAmount = (user.userwallet) + Number(credit);
        await userModel.findOneAndUpdate(user, {
            userwallet: newAmount,
        });
        return res.status(200).redirect('/profile');


    });

module.exports = bookRouter;