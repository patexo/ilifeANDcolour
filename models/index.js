const path = require('path');

// Load ORM
const Sequelize = require('sequelize');


// Environment variable to define the URL of the data base to use.
// To use SQLite data base:
//    DATABASE_URL = sqlite:instant.sqlite
const url = process.env.DATABASE_URL || "sqlite:instant.sqlite";

const sequelize = new Sequelize(url);

// Import the definition of the Instant Table from instant.js
sequelize.import(path.join(__dirname, 'instant'));

// Import the definition of the Users Table from user.js
sequelize.import(path.join(__dirname,'user'));

// Session
sequelize.import(path.join(__dirname,'session'));

module.exports = sequelize;