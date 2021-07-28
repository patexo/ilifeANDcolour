const {Model} = require('sequelize');

// Definition of the Instant model:

module.exports = (sequelize, DataTypes) => {

    class Instant extends Model {}

    Instant.init({
            title: {
                type: DataTypes.STRING,
                validate: {notEmpty: {msg: "Title must not be empty"}}
            },
            description: {
                type: DataTypes.STRING,
                validate: {notEmpty: {msg: "Description must not be empty"}}
            }
        }, {
            sequelize
        }
    );

    return Instant;
};