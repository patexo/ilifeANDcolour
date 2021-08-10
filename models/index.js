const path = require('path');

// Load ORM
const Sequelize = require('sequelize');


// Environment variable to define the URL of the data base to use.
// To use SQLite data base:
//    DATABASE_URL = sqlite:instant.sqlite
// To use  Heroku Postgres data base:
//    DATABASE_URL = postgres://user:passwd@host:port/database
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
Attachment.hasOne(User, {as: 'user', foreignKey: 'photoId'});
User.belongsTo(Attachment, {as: "photo", foreignKey: 'photoId'});

// Relation N-to-N between Instant and User:
//    A User has many favourite instants.
//    A instant has many fans (the users who have marked it as favorite)
Instant.belongsToMany(User, {
    as: 'fans',
    through: 'Favourites',
    foreignKey: 'instantId',
    otherKey: 'userId'
});

User.belongsToMany(Instant, {
    as: 'favouriteInstants',
    through: 'Favourites',
    foreignKey: 'userId',
    otherKey: 'instantId'
});

module.exports = sequelize;