const mongoose = require('mongoose');
const { type } = require('os');

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
    usertype:{
        type:String,
        default:"user"
    }
});
const userModel = mongoose.model('user', userSchema);

module.exports = userModel;