// Handle uncaught exception
process.on('uncaughtException', (error) => {
  console.log('Uncaught exception: Error: ', error);
  process.exit(1);
});

const dotenv = require('dotenv');
dotenv.config();
require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 9000;

const server = app.listen(PORT, () => {
  console.log(`Server is listening at PORT: ${PORT}`);
});

// Handle unhandled rejection
process.on('unhandledRejection', (error) => {
  console.log('Unhandled rejection: Error', error);
  server.close(() => {
    process.exit(1);
  });
});
