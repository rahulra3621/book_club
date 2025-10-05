# BookClubApp

A simple Book Club application built with Express.js, EJS, and MongoDB (Mongoose).

## Prerequisites
- Node.js LTS
- MongoDB running locally at `mongodb://localhost:27017/bookClubApp`

## Install
```bash
npm install
```

## Run
Add convenient scripts to `package.json` (optional):
```json
{
  "scripts": {
    "dev": "nodemon app.js",
    "start": "node app.js"
  }
}
```

Start the server:
```bash
npm run dev
# or
npm start
```

Server runs on `http://localhost:4000` by default.

## Project Structure
- `app.js` Express server, routes, and Mongo models
- `views/` EJS templates
- `public/css/` global styles (`index.css`)
- `books_data.json` seed/sample data

## Environment
Create a `.env` if you later externalize configuration (Mongo URI, port, etc.). The repository ignores `.env` by default.

## Scripts and Tooling
- EJS for templating
- Mongoose for MongoDB ODM
- Nodemon for development reloads

## License
ISC
