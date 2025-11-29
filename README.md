# BookClubApp

An Express.js Book Club application using EJS views, MongoDB (via Mongoose), cookies, and JWT-based auth middleware.

## Live Demo
- App on Vercel: [BookClubApp Deployment](https://book-club-livid.vercel.app/)

## Prerequisites
- Node.js (LTS recommended)
- MongoDB instance (local or remote)

## Environment
Create a `.env` file in the project root with your MongoDB connection string:
```bash
MONGO_URI=mongodb://localhost:27017/bookClubApp
SECRET_KEY=change-this-in-production
```
The app reads `MONGO_URI` via `dotenv`. The server listens on port `4000` (configured in `app.js`).

## Install
```bash
npm install
```

## Run
You can run directly with Node or use Nodemon for auto-reloads:
```bash
# direct
node app.js

# with nodemon (if installed)
npx nodemon app.js
```
Alternatively, add scripts in `package.json` (optional):
```json
{
  "scripts": {
    "dev": "nodemon app.js",
    "start": "node app.js"
  }
}
```

App starts at `http://localhost:4000`.

## Project Structure
- `app.js` Express app setup, EJS config, static assets, Mongo connection
- `routes/` route modules (e.g., `userRouter`, `bookRouter`)
- `middleware/` authentication middleware (JWT via cookies)
- `models/` Mongoose schemas/models
- `views/` EJS templates
- `public/` static assets (e.g., CSS)
- `books_data.json` sample/seed data

### Routes and Views

Public routes (no JWT):
- `GET /` → renders `index`
- `GET /login` → renders `login`
- `POST /login` → authenticate, sets `token` cookie, redirects to `/home`
- `GET /login/admin` → for admin login, renders `login`
- `POST /login/admin` → verifies usertype, authenticate, sets `token` cookie, redirects to `/home`
- `GET /register` → renders `register`
- `POST /register` → create user, redirects to `/login`
- `GET /reset` → renders `reset`
- `POST /reset` → reset password (by `username` + `email`), renders `reset`

Protected routes (require valid `token` cookie; see `middleware/authMiddleware.js`):
- `GET /logout` → clears `token`, renders `index`
- `GET /home` → renders `home` with `{ user, books, err }`
- `GET /profile` → renders `profile` with `{ user }`
- `GET /home/rent/:bookId` → rent flow gate; if issued, renders `home` with error; else `checkout`
- `GET /checkout/:bookId` → performs debit and marks book issued; renders `rentSuccess` or `recharge`
- `GET /mybooks` → renders `mybooks` with `{ user, books }`
- `GET /mybooks/return/:bookId` → returns book, renders `returnSuccess`
- `GET /search?q=...` → case-insensitive search by name/author/publisher; renders `home`
- `GET /recharge` → renders `recharge`
- `POST /recharge` → credits wallet from form, redirects to `/profile`
- Only admin role routes (require `usertype:admin` for these routes else `home` will be rendered)
  - `GET /home/addbook` → renders `addbook` with `{ user, err }`
  - `POST /home/addbook` → creates new book in DB and redirects to `/home`
  - `GET /home/editbook/:bookId` → renders `editbook` with `{ user, book, err }`
  - `POST /home/editbook` → updates book information in DB and redirects to `/home`
  - `GET /home/deletebook/:bookId` → renders `deletebook` with `{ user, book, err }`
    - If the book is already issued then it can't be deleted.
  - `POST /home/deletebook` → deletes book from DB and renders `deletedbook`
  - `GET /viewusers` → renders `allusers` with `{ user, allusers, searchInp, err }`

Views present:
- `views/index.ejs`, `home.ejs`, `login.ejs`, `register.ejs`, `reset.ejs`
- `profile.ejs`, `mybooks.ejs`, `checkout.ejs`, `rentSuccess.ejs`, `returnSuccess.ejs`
- `recharge.ejs`, `addbook.ejs`, `editbook.ejs`, `deletebook.ejs`, `deletedbook.ejs`
- `allusers.ejs`, `404.ejs`, `payment.ejs` (present, not directly routed)

## Tech Stack
- Express 5
- EJS templating
- Mongoose 8
- JSON Web Tokens
- cookie-parser
- dotenv
- Nodemon (dev)

## Data Models

`models/userModel.js`
- `username: String` (minlength 3, required)
- `userpasswd: String` (bcrypt hashed, minlength 6, required)
- `usermail: String` (unique by usage in code path, required)
- `userwallet: Number` (default 0)
- `bookIssued: Object` (unused in current flows, default null)
- `usertype: String` (default user, required)

`models/bookModel.js`
- `bookName: String` (required)
- `bookAuthor: String` (required)
- `bookPublisher: String` (required)
- `bookPrice: Number` (required)
- `isIssued: Boolean` (default false)
- `isIssuedTo: ObjectId` (user id or null)

## Authentication & Cookies
- Login issues a JWT: payload `{ id: user._id }`, signed with `SECRET_KEY`.
- Token is stored in an httpOnly cookie named `token`.
- `middleware/authMiddleware.js` verifies the token and sets `req.id` to the user id.
- Protected routes depend on `req.id` to fetch the user.
- On verification failure, the cookie is cleared and user is redirected to `/login`.

## Business Rules
- Renting a book deducts full `bookPrice` from `userwallet` and marks the book as issued.
- Returning a book resets `isIssued`/`isIssuedTo`.
- Checkout requires sufficient wallet balance; otherwise, user is sent to `recharge`.
- Search matches `bookName`, `bookAuthor`, or `bookPublisher` (case-insensitive, substring).

## Static Assets
- `public/css/index.css` loaded via `express.static('public')`.

## Notes
- Ensure MongoDB is running and reachable via `MONGO_URI` before starting the server.
- `.env` is ignored by Git by default; do not commit secrets.

## License
ISC
