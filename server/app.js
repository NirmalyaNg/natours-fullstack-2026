const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');
const helmet = require('helmet');
const { sanitize: expressMongoSanitize } = require('express-mongo-sanitize');
const { sanitize: expressXssSanitize } = require('express-xss-sanitizer');
const qs = require('qs');
const hpp = require('hpp');

const app = express();
const limiter = rateLimit({
  limit: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again after some time',
});

const hppWhitelist = new Set([
  'name',
  'duration',
  'maxGroupSize',
  'difficulty',
  'ratingsAverage',
  'ratingsQuantity',
  'price',
  'priceDiscount',
  'summary',
  'slug',
]);

// Keep only the last value of a repeated query param, unless it's whitelisted
function preventParamPollution(query) {
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value) && !hppWhitelist.has(key)) {
      query[key] = value[value.length - 1];
    }
  });
  return query;
}

app.set('query parser', (str) =>
  preventParamPollution(expressXssSanitize(expressMongoSanitize(qs.parse(str)), { allowedTags: [] })),
);

// Middlewares
app.use(helmet());
app.use(cors());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(limiter);
app.use(express.json({ limit: '10kb' }));
// Sanitize req.body manually with express-mongo-sanitize's sanitize() function and express-xss-sanitizer's sanitize function.
// The package's middleware reassigns req.body, req.params, req.headers and req.query
// after sanitizing them. In Express 5, req.query is a getter-only property, so that
// reassignment throws a TypeError.
app.use((req, res, next) => {
  if (req.body) {
    expressMongoSanitize(req.body);
    req.body = expressXssSanitize(req.body, {
      allowedTags: [],
    });
  }
  next();
});
app.use(cookieParser());
app.use(
  hpp({
    whitelist: [
      'name',
      'duration',
      'maxGroupSize',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
      'priceDiscount',
      'summary',
      'slug',
    ],
  }),
);

// Routers
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.use((req, res, next) => {
  next(new AppError(`Cannot access ${req.originalUrl} on the server.`, 404));
});

// Global Error Middleware
app.use(globalErrorHandler);

module.exports = app;
