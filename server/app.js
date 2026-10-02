// Handle uncaught exception
process.on('uncaughtException', (error) => {
  console.log('Uncaught exception: Error: ', error);
  process.exit(1);
});

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');

const app = express();

app.set('query parser', 'extended');

// Middlewares
app.use(express.json());
app.use(cors());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.use((req, res, next) => {
  next(new AppError(`Cannot access ${req.originalUrl} on the server.`, 404));
});

// Global Error Middleware
app.use(globalErrorHandler);

module.exports = app;
