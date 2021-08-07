const Sequelize = require("sequelize");
// Op es una abreviatura para hacer mas compactas las expresiones de búsqueda.
const Op = Sequelize.Op;
const {models} = require("../models");
const attHelper = require("../helpers/attachments");

const moment = require('moment');

const paginate = require('../helpers/paginate').paginate;

// Autoload el instant asociado a :instantId
exports.load = async (req, res, next, instantId) => {

    try {
        const instant = await models.Instant.findByPk(instantId, {
            include: [ 
                {model: models.Attachment, as: 'attachment'},
                {
                    model: models.User, 
                    as: 'author',
                    include: [{
                        model: models.Attachment,
                        as: "photo"
                    }]
                } 
            ]
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

// MW - Un usuario no puede crear mas de 50 quizzes al dia.
exports.limitPerDay = async (req, res, next) => {

    const LIMIT_PER_DAY = 50;

    const yesterday = moment().subtract(1, 'days')

    // console.log("ayer = ", yesterday.calendar());

    let countOptions = {
        where: {
            authorId: req.loginUser.id,
            createdAt: {$gte: yesterday}
        }
    };

    try {
        const count = await models.Instant.count(countOptions);

        if (count < LIMIT_PER_DAY) {
            next();
        } else {
            req.flash('error', `Maximun ${LIMIT_PER_DAY} new instants per day.`);
            res.redirect('/goback');
        }
    } catch (error) {
        next(error);
    }
};

// MW that allows actions only if the user logged in is admin or is the author of the quiz.
exports.adminOrAuthorRequired = (req, res, next) => {

    const isAdmin  = !!req.loginUser.isAdmin;
    const isAuthor = req.load.instant.authorId === req.loginUser.id;

    if (isAdmin || isAuthor) {
        next();
    } else {
        console.log('Prohibited operation: The logged in user is not the author of the quiz, nor an administrator.');
        res.send(403);
    }
};


// GET /instants
exports.index = async (req, res, next) => {

    let countOptions = {
        where: {}
    };
    let findOptions = {
        where: {}
    };

    let title = "Instants";

    // Search:
    const search = req.query.search || '';
    if (search) {
        const search_like = "%" + search.replace(/ +/g,"%") + "%";

        countOptions.where.title = { [Op.like]: search_like };
        findOptions.where.title = { [Op.like]: search_like };
    }

    // If there exists "req.load.user", then only the instants of that user are shown
    if (req.load && req.load.user) {
        countOptions.where.authorId = req.load.user.id;
        findOptions.where.authorId = req.load.user.id;

        if (req.loginUser && req.loginUser.id == req.load.user.id) {
            title = "My Instants";
        } else {
            title = "Instants of " + req.load.user.username;
        }
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
        findOptions.include = [
            {model: models.Attachment, as: 'attachment'},
            {
                model: models.User,
                as: 'author',
                include: [{
                    model: models.Attachment,
                    as: "photo"
                }]
            }
        ];

        const instants = await models.Instant.findAll(findOptions);
        res.render('instants/index.ejs', {
            instants,
            search,
            attHelper,
            title
        });
    } catch (error) {
        next(error);
    }
};


// GET /instants/:instantId
exports.show = (req, res, next) => {

    const {instant} = req.load;

    res.render('instants/show', {
        instant,
        attHelper
    });
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

    const authorId = req.loginUser && req.loginUser.id || 0;

    let instant = models.Instant.build({
        title,
        description,
        authorId
    });

    try {
        // Saves only the fields title and description into the DDBB
        instant = await instant.save({fields: ["title", "description", "authorId"]});
        req.flash('success', 'Instant created successfully.');

        try {
            if (!req.file) {
                req.flash('info', 'Instant without attachment.');
                return;
            }
            // Create the instant attachment
            await createInstantAttachment(req, instant);
        } catch (error) {
            req.flash('error', 'Failed to create attachment:' + error.message);
        } finally {
            res.redirect('/instants/' + instant.id);
        }
    } catch (error) {
        if (error instanceof Sequelize.ValidationError) {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('instants/new', {instant});
        } else {
            req.flash('error', 'Error creating a new Instant: ' + error.message);
            next(error)
        }
    } finally {
        // delete the file uploaded to ./uploads by multer.
        if (req.file) {
            attHelper.deleteLocalFile(req.file.path);
        }
    }
};

// Aux function to upload req.file to cloudinary, create an attachment with it, and
// associate it with the gien instant.
// This function is called from the create an update middleware. DRY.
const createInstantAttachment = async (req, instant) => {

    // Save the attachment into Cloudinary
    const uploadResult = await attHelper.uploadResource(req);

    let attachment;
    try {
        // Create the new attachment into the data base.
        attachment = await models.Attachment.create({
            resource: uploadResult.resource,
            url: uploadResult.url,
            filename: req.file.originalname,
            mime: req.file.mimetype
        });
        await instant.setAttachment(attachment);
        req.flash('success', 'Attachment saved successfully.');
    } catch (error) { // Ignoring validation errors
        req.flash('error', 'Failed linking attachment: ' + error.message);
        attHelper.deleteResource(uploadResult.resource);
        attachment && attachment.destroy();
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

        try {
            if (req.body.keepAttachment) return; // Don't change the attachment.

             // The attachment can be changed if more than 1 minute has passed since the last change:
             if (instant.attachment) {

                const now = moment();
                const lastEdition = moment(instant.attachment.updatedAt);

                if (lastEdition.add(1,"m").isAfter(now)) {
                    req.flash('error', 'Attached file can not be modified until 1 minute has passed.');
                    return
                }
            }

            // Delete old attachment.
            if (instant.attachment) {
                attHelper.deleteResource(instant.attachment.resource);
                await instant.attachment.destroy();
                await instant.setAttachment();
            }

            if (!req.file) {
                req.flash('info', 'Instant without attachment.');
                return;
            }

            // Create the instant attachment
            await createInstantAttachment(req, instant);

        } catch (error) {
            req.flash('error', 'Failed saving the new attachment: ' + error.message);
        } finally {
            res.redirect('/instants/' + instant.id);
        }
    } catch (error) {
        if (error instanceof Sequelize.ValidationError) {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('instants/edit', {instant});
        } else {
            req.flash('error', 'Error editing the Instant: ' + error.message);
            next(error);
        }

    } finally {
        // delete the file uploaded to ./uploads by multer.
        if (req.file) {
            attHelper.deleteLocalFile(req.file.path);
        }
    }
};


// DELETE /instants/:instantId
exports.destroy = async (req, res, next) => {

    const attachment = req.load.instant.attachment;

    // Delete the attachment
    if (attachment) {
        try {
            attHelper.deleteResource(attachment.resource);
        } catch (error) {
        }
    }

    try {
        await req.load.instant.destroy();
        attachment && await attachment.destroy();
        req.flash('success', 'Instant deleted successfully.');
        res.redirect('/goback');
    } catch (error) {
        req.flash('error', 'Error deleting the Instant: ' + error.message);
        next(error);
    }
};
