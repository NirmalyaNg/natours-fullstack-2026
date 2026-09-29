const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGODB_URI)
  .then((conn) => {
    console.log('Database connected successfully. Host:', conn.connection.host);
  })
  .catch((error) => {
    console.log('Database connection unsuccessfull. Error:', error);
    process.exit(1);
  });
