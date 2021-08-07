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

// Import the definition of the Attachments Table from attachment.js
const Attachment = sequelize.import(path.join(__dirname,'attachment'));

// Session
sequelize.import(path.join(__dirname,'session'));


// Relation 1-to-N between User and Instant:
User.hasMany(Instant, {as: 'instants', foreignKey: 'authorId'});
Instant.belongsTo(User, {as: 'author', foreignKey: 'authorId'});


// Relation 1-to-1 between Instant and Attachment
Attachment.hasOne(Instant, {as: 'instant', foreignKey: 'attachmentId'});
Instant.belongsTo(Attachment, {as: 'attachment', foreignKey: 'attachmentId'});

// Relation 1-to-1 between User and Attachment
User.belongsTo(Attachment, {as: "photo", foreignKey: 'photoId'});
Attachment.hasOne(User, {as: 'user', foreignKey: 'photoId'});

module.exports = sequelize;