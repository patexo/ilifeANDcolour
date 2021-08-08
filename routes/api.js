
const express = require('express');
const router = express.Router();

const tokenApi = require('../api/token');

const instantApi = require('../api/instant');
const userApi = require('../api/user');
const favouriteApi = require('../api/favourite');

//-----------------------------------------------------------

// Debug trace.
router.all('*', function(req, res, next) {

    console.log("=== API ===>", req.url);
    next();
});

// All routes require an user access token.
router.all('*', tokenApi.tokenRequired);

//-----------------------------------------------------------

// Autoload the objects associated to the given route parameter.
router.param('userId',       userApi.load);
router.param('instantId',       instantApi.load);

router.param('instantId_woi',   instantApi.load_woi);

//-----------------------------------------------------------

// Routes for the users resource.

router.get('/users',
    userApi.index);

router.get('/users/:userId(\\d+)',
    userApi.show);

router.get('/users/tokenOwner',
    userApi.loadToken,
    userApi.show);

//-----------------------------------------------------------

// Routes for the instants resource.

router.get('/instants',
    instantApi.index);

router.get('/instants/:instantId(\\d+)',
    instantApi.show);

router.get('/users/:userId(\\d+)/instants',
    instantApi.index);

router.get('/users/tokenOwner/instants',
    userApi.loadToken,
    instantApi.index);

//-----------------------------------------------------------

// Routes to manage favourites

router.put('/users/tokenOwner/favourites/:instantId_woi(\\d+)',
    userApi.loadToken,
    favouriteApi.add);

router.delete('/users/tokenOwner/favourites/:instantId_woi(\\d+)',
    userApi.loadToken,
    favouriteApi.del);

//-----------------------------------------------------------

// If I am here, then the requested route is not defined.
router.all('*', function(req, res, next) {

    var err = new Error('Ruta API no encontrada');
    err.status = 404;
    next(err);
});

//-----------------------------------------------------------

// Error
router.use(function(err, req, res, next) {

    var emsg = err.message || "Error Interno";

    console.log(emsg);

    res.status(err.status || 500)
    .send({error: emsg})
    .end();
});

//-----------------------------------------------------------

module.exports = router;

//-----------------------------------------------------------
