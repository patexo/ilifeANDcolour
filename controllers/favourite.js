
// PUT /users/:userId/favourites/:instantId
exports.add = async (req, res, next) => {

    try {
        await req.load.instant.addFan(req.load.user);
        if (req.xhr) {
            res.send(200);
        } else {
            res.sendStatus(415);
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
};


// DELETE /users/:userId/favourites/:instantId
exports.del = async (req, res, next) => {

    try {
        await req.load.instant.removeFan(req.load.user);
        if (req.xhr) {
            res.send(200);
        } else {
            res.sendStatus(415);
        }
    } catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
};