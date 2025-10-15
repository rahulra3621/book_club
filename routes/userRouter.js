const express = require('express');
const jwt = require("jsonwebtoken");
const userModel = require('../models/userModel');
const userRouter = express.Router();
const bcrypt = require("bcrypt");
const SECRET_KEY = process.env.SECRET_KEY;


//------------------------------------- Log In --------------------------------------------------

userRouter.route('/login')
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

userRouter.route('/register')
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

userRouter.route('/reset')
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

module.exports = userRouter;