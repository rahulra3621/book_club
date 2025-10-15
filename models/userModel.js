const mongoose = require('mongoose')

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

module.exports = userModel;