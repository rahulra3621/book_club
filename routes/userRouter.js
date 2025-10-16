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
        try {
            const { email, password } = req.body;
            const user = await userModel.findOne({
                usermail: email,
            });
            if (!user) {
                res.status(404).render('login', { err: 'User Not Found!' })
            }
            else {
                const validPassword = await bcrypt.compare(password, user.userpasswd);
                if (!validPassword) {
                    res.status(401).render('login', { err: 'Invalid Credentials !!!' })
                }
                else {
                    const token = await jwt.sign({ id: user._id }, SECRET_KEY);
                    res.cookie('token', token, { httpOnly: true })
                    res.status(200).redirect(`/home`);
                }
            }
        }
        catch(e){
            res.status(403).render('login', { err: 'Login Failed!' })
        }

    });

// --------------------------------- Register ------------------------------------------------

userRouter.route('/register')
    .get((req, res) => {
        res.render('register', { err: null });
    })
    .post(async (req, res) => {
        try {
            const { username, password, email } = req.body;
            if (username && password && email && !Number(username)) {
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
            else if (Number(username)) {
                res.status(400).render('register', { err: 'Username cannot be only numbers!' })
            }
            else {
                res.status(404).render('register', { err: 'All fields are required !!!' })
            }
        }
        catch (e) {
            res.status(403).render('register', { err: "Error: User Not Created " + e });
        }
    });

// ---------------------------------- Reset password ---------------------------------------

userRouter.route('/reset')
    .get((req, res) => {
        res.render('reset', { err: null });
    })
    .post(async (req, res) => {
        try {
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
                res.status(200).render('reset', { err: 'Password reset successfully!!' })
            }
            else {
                res.status(404).render('reset', { err: 'Cannot find any user with this Username and Email' });
            }
        }
        catch (e) {
            res.status(403).render('reset', { err: "Something Went Wrong!!!" })
        }
    });

module.exports = userRouter;