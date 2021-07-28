const Sequelize = require("sequelize");
const {models} = require("../models");

const paginate = require('../helpers/paginate').paginate;

// Autoload el instant asociado a :instantId
exports.load = async (req, res, next, instantId) => {

    try {
        const instant = await models.Instant.findByPk(instantId);
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


// GET /instants
exports.index = async (req, res, next) => {

    try {

        const count = await models.Instant.count();

        // Pagination:

        const items_per_page = 10;

        // The page to show is given in the query
        const pageno = parseInt(req.query.pageno) || 1;

        // Create a String with the HTMl used to render the pagination buttons.
        // This String is added to a local variable of res, which is used into the application layout file.
        res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

        const findOptions = {
            offset: items_per_page * (pageno - 1),
            limit: items_per_page
        };

        const instants = await models.Instant.findAll(findOptions);
        res.render('instants/index.ejs', {instants});
    } catch (error) {
        next(error);
    }
};


// GET /instants/:instantId
exports.show = (req, res, next) => {

    const {instant} = req.load;

    res.render('instants/show', {instant});
};


// GET /instants/new
exports.new = (req, res, next) => {

    const instant = {
        title: "",
        description: ""
    };

    res.render('instants/new', {instant});
};

// POST /instants/create
exports.create = async (req, res, next) => {

    const {title, description} = req.body;

    let instant = models.Instant.build({
        title,
        description
    });

    try {
        // Saves only the fields title and description into the DDBB
        instant = await instant.save({fields: ["title", "description"]});
        res.redirect('/instants/' + instant.id);
    } catch (error) {
        if (error instanceof Sequelize.ValidationError) {
            console.log('There are errors in the form:');
            error.errors.forEach(({message}) => console.log(message));
            res.render('instants/new', {instant});
        } else {
            next(error);
        }
    }
};


// GET /instants/:instantId/edit
exports.edit = (req, res, next) => {

    const {instant} = req.load;

    res.render('instants/edit', {instant});
};


// PUT /instants/:instantId
exports.update = async (req, res, next) => {

    const {body} = req;
    const {instant} = req.load;

    instant.title = body.title;
    instant.description = body.description;

    try {
        await instant.save({fields: ["title", "description"]});
        res.redirect('/instants/' + instant.id);
    } catch (error) {
        if (error instanceof Sequelize.ValidationError) {
            console.log('There are errors in the form:');
            error.errors.forEach(({message}) => console.log(message));
            res.render('instants/edit', {instant});
        } else {
            next(error);
        }
    }
};


// DELETE /instants/:instantId
exports.destroy = async (req, res, next) => {

    try {
        await req.load.instant.destroy();
        res.redirect('/instants');
    } catch (error) {
        next(error);
    }
};
