
const SECRET_KEY = process.env.SECRET_KEY;
const jwt = require("jsonwebtoken");
// ---------------------------------- AuthMiddleware Functionality -------------------------------

function authMiddleware(req, res, next) {
    try {
        const token = req.cookies?.token;
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        });
        if (!token) return res.redirect('/login');

        const verifiedUser = jwt.verify(token, SECRET_KEY);
        req.id = verifiedUser.id;
        next();
    } catch (err) {
        console.error('JWT Error:', err.message);
        return res.clearCookie('token').redirect('/login');
    }
}

module.exports = authMiddleware;