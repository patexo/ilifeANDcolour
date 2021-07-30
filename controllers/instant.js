const Sequelize = require("sequelize");
// Op es una abreviatura para hacer mas compactas las expresiones de búsqueda.
const Op = Sequelize.Op;
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

    let countOptions = {};
    let findOptions = {};

    // Search:
    const search = req.query.search || '';
    if (search) {
        const search_like = "%" + search.replace(/ +/g,"%") + "%";

        countOptions.where = {title: { [Op.like]: search_like }};
        findOptions.where = {title: { [Op.like]: search_like }};
    }

    try {

        const count = await models.Instant.count(countOptions);

        // Pagination:

        const items_per_page = 10;

        // The page to show is given in the query
        const pageno = parseInt(req.query.pageno) || 1;

        // Create a String with the HTMl used to render the pagination buttons.
        // This String is added to a local variable of res, which is used into the application layout file.
        res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

        findOptions.offset = items_per_page * (pageno - 1);
        findOptions.limit = items_per_page;

        const instants = await models.Instant.findAll(findOptions);
        res.render('instants/index.ejs', {
            instants,
            search
        });
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
        req.flash('success', 'Instant created successfully.');
        res.redirect('/instants/' + instant.id);
    } catch (error) {
        if (error instanceof Sequelize.ValidationError) {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('instants/new', {instant});
        } else {
            req.flash('error', 'Error creating a new Instant: ' + error.message);
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
        req.flash('success', 'Instant edited successfully.');
        res.redirect('/instants/' + instant.id);
    } catch (error) {
        if (error instanceof Sequelize.ValidationError) {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('instants/edit', {instant});
        } else {
            req.flash('error', 'Error editing the Instant: ' + error.message);
            next(error);
        }
    }
};


// DELETE /instants/:instantId
exports.destroy = async (req, res, next) => {

    try {
        await req.load.instant.destroy();
        req.flash('success', 'Instant deleted successfully.');
        res.redirect('/goback');
    } catch (error) {
        req.flash('error', 'Error deleting the Instant: ' + error.message);
        next(error);
    }
};
