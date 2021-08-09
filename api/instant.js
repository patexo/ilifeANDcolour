const {models} = require('../models');
const Sequelize = require('sequelize');

const js2xmlparser = require("js2xmlparser");

const addPagenoToUrl = require('../helpers/paginate').addPagenoToUrl;

//-----------------------------------------------------------


// Autoload el instant asociado a :instantId.
// Includes author, fans and attachment.
exports.load = async (req, res, next, instantId) => {

    try {
        const instant = await models.Instant.findByPk(instantId, {
            attributes: {exclude: ['createdAt', 'updatedAt', 'deletedAt']},
            include: [
                {
                    model: models.Attachment,
                    as: 'attachment',
                    attributes: ['filename', 'mime', 'url']
                },
                {
                    model: models.User,
                    as: 'author',
                    attributes: ['id', 'isAdmin', 'username', 'githubId', 'githubUsername'],
                    include: [{
                        model: models.Attachment,
                        as: 'photo',
                        attributes: ['filename', 'mime', 'url']
                    }]
                },
                {
                    model: models.User,
                    as: "fans",
                    attributes: ['id'],
                    through: {attributes: []}
                }]
        });

        if (instant) {
            req.load = {...req.load, instant};
            next();
        } else {
            throw new Error('There is no instant with id=' + instantId);
        }
    } catch (error) {
        next(error);
    }
};


// Autoload el instant asociado a :instantId
// Without includes.
exports.load_woi = async (req, res, next, instantId) => {

    try {
        const instant = await models.Instant.findByPk(instantId, {
            attributes: {exclude: ['createdAt', 'updatedAt', 'deletedAt']}
        });
        if (instant) {
            req.load = {...req.load, instant};
            next();
        } else {
            throw new Error('There is no instant with id=' + instantId);
        }
    } catch (error) {
        next(error);
    }
};

//-----------------------------------------------------------

// GET /api/instants
exports.index = async (req, res, next) => {

    let countOptions = {
        where: {},
        include: []
    };

    // Search instants which title field contains the value given in the query.
    const search = req.query.search || '';
    if (search) {
        const search_like = "%" + search.replace(/ +/g, "%") + "%";

        countOptions.where.question = {[Sequelize.Op.like]: search_like};
    }

    // User instants: If there exists "req.load.user", then only the instants of that user are shown
    if (req.load && req.load.user) {
        countOptions.where.authorId = req.load.user.id;
    }

    // Filter my favourite instants:
    // Lists all the instants or my favourite instants.
    const searchfavourites = !!req.query.searchfavourites;
    if (searchfavourites) {
        countOptions.include.push({
            model: models.User,
            as: "fans",
            where: {id: req.load.token.userId},
            attributes: ['id'],
            through: {attributes: []}
        });
    } else {

        // NOTE:
        // It should be added the options ( or similars )
        // to have a lighter query:
        //    where: {id: req.load.token.userId},
        //    required: false  // OUTER JOIN
        // but this does not work with SQLite. The generated
        // query fails when there are several fans of the same instant.

        countOptions.include.push({
            model: models.User,
            as: "fans",
            attributes: ['id'],
            through: {attributes: []}
        });
    }


    // Pagination:

    const items_per_page = 10;

    // The page to show is given in the query
    const pageno = parseInt(req.query.pageno) || 1;

    let totalItems = 0;

    try {
        const count = await models.Instant.count(countOptions);

        totalItems = count;

        const findOptions = {
            ...countOptions,
            attributes: {exclude: ['description', 'createdAt', 'updatedAt', 'deletedAt']},
            offset: items_per_page * (pageno - 1),
            limit: items_per_page
        };

        findOptions.include.push({
            model: models.Attachment,
            as: 'attachment',
            attributes: ['filename', 'mime', 'url']
        });

        findOptions.include.push({
            model: models.User,
            as: 'author',
            attributes: ['id', 'isAdmin', 'username', 'githubId', 'githubUsername'],
            include: [{
                model: models.Attachment,
                as: 'photo',
                attributes: ['filename', 'mime', 'url']
            }]
        });

        let instants = await models.Instant.findAll(findOptions);

        instants = instants.map(instant => ({
            id: instant.id,
            title: instant.title,
            author: instant.author,
            attachment: instant.attachment,
            favourite: instant.fans.some(fan => fan.id == req.load.token.userId)
        }));

        let nextUrl = "";
        const totalPages = Math.ceil(totalItems / items_per_page);
        if (pageno < totalPages) {
            let nextPage = pageno + 1;

            // In production (Heroku) I will use https.
            let protocol = process.env.NODE_ENV === 'production' ? "https" : req.protocol;
            nextUrl = addPagenoToUrl(`${protocol}://${req.headers["host"]}${req.baseUrl}${req.url}`, nextPage)
        }

        const format = (req.params.format || 'json').toLowerCase();

        switch (format) {
            case 'json':

                res.json({
                    instants,
                    pageno,
                    nextUrl
                });
                break;

            case 'xml':

                var options = {
                    typeHandlers: {
                        "[object Null]": function(value) {
                            return js2xmlparser.Absent.instance;
                        }
                    }
                };

                res.set({
                    'Content-Type': 'application/xml'
                }).send(
                    js2xmlparser.parse("instants", {instant: instants}, options)
                );
                break;

            default:
                console.log('No supported format \".' + format + '\".');
                res.sendStatus(406);
        }

    } catch (error) {
        next(error);
    }
};

//-----------------------------------------------------------


// GET /instants/:instantId
exports.show = (req, res, next) => {

    const {instant, token} = req;

    //   if this instant is one of my favourites, then I create
    //   the attribute "favourite = true"

    const format = (req.params.format || 'json').toLowerCase();

    const data = {
        id: instant.id,
        title: instant.title,
        author: instant.author && instant.author.get({plain:true}),
        attachment: instant.attachment && instant.attachment.get({plain:true}),
        favourite: instant.fans.some(fan => fan.id == token.userId)
    };

    switch (format) {
        case 'json':

            res.json(data);
            break;

        case 'xml':

            var options = {
                typeHandlers: {
                    "[object Null]": function (value) {
                        return js2xmlparser.Absent.instance;
                    }
                }
            };

            res.set({
                'Content-Type': 'application/xml'
            }).send(
                js2xmlparser.parse("instant", data, options)
            );
            break;

        default:
            console.log('No supported format \".' + format + '\".');
            res.sendStatus(406);
    }
};
