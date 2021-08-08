
const {models} = require('../models');
const Sequelize = require('sequelize');

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

        res.json({
            instants,
            pageno,
            nextUrl
        });

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

    res.json({
        id: instant.id,
        title: instant.title,
        author: instant.author,
        attachment: instant.attachment,
        favourite: instant.fans.some(fan => fan.id == token.userId)
    });
};

//-----------------------------------------------------------

// GET /instants/random
exports.random = async (req, res, next) => {

    const {token} = req;

    try {
        const instantId = await randomInstantId([]);

        if (instantId) {
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
            if (!instant) {
                throw new Error('There is no instant with id=' + instantId);
            }

            // If this instant is one of my favourites, then I create
            // the attribute "favourite = true"

            res.json({
                id: instant.id,
                title: instant.title,
                author: instant.author,
                attachment: instant.attachment,
                favourite: instant.fans.some(fan => fan.id == token.userId)
            });
        } else {
            res.json({nomore: true});
        }
    } catch (error) {
        next(error);
    }
};


// GET /instants/:instantId_woi/check
exports.check = (req, res, next) => {

    const {instant, query} = req;

    const description = query.description || "";

    const result = description.toLowerCase().trim() === instant.description.toLowerCase().trim();

    res.json({
        instantId: instant.id,
        description,
        result
    });
};

//-----------------------------------------------------------


exports.randomPlayNew = (req, res, next) => {

    req.session.randomPlay = {
        currentInstantId: 0,
        resolved: []
    };

    randomPlayNextInstant(req, res, next);
};


exports.randomPlayNext = (req, res, next) => {

    randomPlayNextInstant(req, res, next);
};


const randomPlayNextInstant = async (req, res, next) => {

    if (!req.session.randomPlay) {
        req.session.randomPlay = {
            currentInstantId: 0,
            resolved: []
        };
    }

    try {
        let instantId;
        // volver a mostrar la misma pregunta que la ultima vez que pase por aqui y no conteste:
        if (req.session.randomPlay.currentInstantId) {
            instantId = req.session.randomPlay.currentInstantId;
        } else {
            // elegir una pregunta al azar no repetida:
            instantId = await randomInstantId(req.session.randomPlay.resolved);
        }

        if (!instantId) {
            const score = req.session.randomPlay.resolved.length;
            delete req.session.randomPlay;
            res.json({nomore: true, score});
        } else {
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
                    }
                ]
            });
            if (!instant) {
                throw new Error('There is no instant with id=' + instantId);
            }

            const score = req.session.randomPlay.resolved.length;

            req.session.randomPlay.currentInstantId = instantId;

            // If this instant is one of my favourites, then I create
            // the attribute "favourite = true"

            res.json({
                instant: {
                    id: instant.id,
                    title: instant.title,
                    author: instant.author,
                    attachment: instant.attachment,
                    favourite: instant.fans.some(fan => fan.id == req.load.token.userId)
                },
                score
            });
        }
    } catch(error) {
        next(error);
    }
};


// GET /instants/randomPlay/check/
exports.randomPlayCheck = async (req, res, next) => {

    if (!req.session.randomPlay ||
        (req.session.randomPlay.currentInstantId === 0)) {
        res.sendStatus(409);
        return;
    }

    const instantId = req.session.randomPlay.currentInstantId;

    try {
        const instant = await models.Instant.findByPk(instantId);

        if (instant) {

            const description = req.query.description || "";

            const result = description.toLowerCase().trim() === instant.description.toLowerCase().trim();

            if (result) {
                req.session.randomPlay.currentInstantId = 0;

                // Evitar que me hagan llamadas a este metodo manualmente con una respuesta acertada para
                // que se guarde muchas veces la misma respuesta en resolved, y asi conseguir que score
                // se incremente indebidamente.
                if (req.session.randomPlay.resolved.indexOf(instant.id) == -1) {
                    req.session.randomPlay.resolved.push(instant.id);
                }
            }

            const score = req.session.randomPlay.resolved.length;

            if (!result) {
                delete req.session.randomPlay;
            }

            res.json({
                description,
                instantId: instant.id,
                result,
                score
            });

        } else {
            throw new Error('There is no instant with id=' + instantId);
        }
    } catch (error) {
        next(error);
    }
};

//-----------------------------------------------------------

// GET /instants/random10wa
exports.random10wa = async (req, res, next) => {

    try {
        const {token} = req;

        let instantIds = [];
        let instants = [];

        const count = await models.Instant.count();

        for (let i = 0; i < 10 && i < count; i++) {
            const whereOpt = {'id': {[Sequelize.Op.notIn]: instantIds}};

            const qarr = await models.Instant.findAll({
                where: whereOpt,
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
                    }
                ],
                offset: Math.floor(Math.random() * (count - i)),
                limit: 1
            });

            if (!qarr.length) break;

            const instant = qarr[0]

            instantIds.push(instant.id);
            instants.push(instant);
        }

        // If this instant is one of my favourites, then I create
        // the attribute "favourite = true"

        res.json(instants.map(instant => ({
            id: instant.id,
            title: instant.title,
            description: instant.description,
            author: instant.author,
            attachment: instant.attachment,
            favourite: instant.fans.some(fan => fan.id == token.userId)
        })));
    } catch (error) {
        next(error);
    }
};

//-----------------------------------------------------------

/**
 * Returns a promise to get a random instantId.
 * Excludes the ids given in the parameter.
 *
 * @param exclude Array of ids to exclude.
 *
 * @return A promise
 */
const randomInstantId = async exclude => {

    const whereOpt = {'id': {[Sequelize.Op.notIn]: exclude}};

    const count = await models.Instant.count({where: whereOpt});


    const instants = await models.Instant.findAll({
        where: whereOpt,
        offset: Math.floor(Math.random() * count),
        limit: 1
    });
    return instants.length ? instants[0].id : 0;
};

//-----------------------------------------------------------