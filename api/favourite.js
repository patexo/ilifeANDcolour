
const {models} = require('../models');

// PUT /users/tokenOwner/favourites/:instantId
exports.add = async (req, res, next) => {

    const tokenUserId = req.load.token.userId;

    try {
        await req.load.instant.addFan(tokenUserId);
        res.send(200);
    } catch (error) {
        next(error);
    }
};


// DELETE /users/tokenOwner/favourites/:instantId
exports.del = async (req, res, next) => {

    const tokenUserId = req.load.token.userId;

    try {
        await req.load.instant.removeFan(tokenUserId);
        res.send(200);
    } catch (error) {
        next(error);
    }
};