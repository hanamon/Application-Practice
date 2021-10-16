require('dotenv').config();
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

// Handling unexpected exceptions
process.on('uncaughtException', (err) => {
  console.log('uncaughtException : ', err);
});

// Middleware
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

// Routing
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Error handling
app.use((req, res, next) => {
  const error = new Error(
    `${req.method} ${req.originalUrl} There is no router.`
  );
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

module.exports = app;
