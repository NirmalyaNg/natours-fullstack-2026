const dotenv = require('dotenv');
dotenv.config();
require('../config/db');
const Tour = require('../models/tourModel');
const tours = require('./data/tours.json');

async function removeData() {
  try {
    await Tour.deleteMany();
    console.log('Data removed successfully.');
    process.exit();
  } catch (error) {
    console.log('Failed to remove data. Error:', error);
    process.exit(1);
  }
}

async function insertData() {
  try {
    await Tour.create(tours);
    console.log('Data inserted successfully.');
    process.exit();
  } catch (error) {
    console.log('Failed to insert data. Error:', error);
    process.exit(1);
  }
}

const arg = process.argv[2];

switch (arg) {
  case '--remove':
    removeData();
    break;
  case '--insert':
    insertData();
    break;
  default:
    console.log('Invalid argument');
    process.exit(1);
}
