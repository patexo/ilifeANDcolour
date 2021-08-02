const path = require('path');

// Load ORM
const Sequelize = require('sequelize');


// Environment variable to define the URL of the data base to use.
// To use SQLite data base:
//    DATABASE_URL = sqlite:instant.sqlite
const url = process.env.DATABASE_URL || "sqlite:instant.sqlite";

const sequelize = new Sequelize(url);

// Import the definition of the Instant Table from instant.js
const Instant = sequelize.import(path.join(__dirname, 'instant'));

// Import the definition of the Users Table from user.js
const User = sequelize.import(path.join(__dirname,'user'));

// Session
sequelize.import(path.join(__dirname,'session'));


// Relation 1-to-N between User and Instant:
User.hasMany(Instant, {as: 'instants', foreignKey: 'authorId'});
Instant.belongsTo(User, {as: 'author', foreignKey: 'authorId'});

module.exports = sequelize;