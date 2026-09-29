const dotenv = require('dotenv');
dotenv.config();
require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(`Server is listening at PORT: ${PORT}`);
});
