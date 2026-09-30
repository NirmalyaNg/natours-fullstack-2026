const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');

const app = express();

app.set('query parser', 'extended');

// Middlewares
app.use(express.json());
app.use(cors());

// Routers
app.use('/api/v1/tours', tourRouter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

module.exports = app;
