const mongoose = require('mongoose');

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

module.exports = bookModel;