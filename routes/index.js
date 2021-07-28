var express = require('express');
var router = express.Router();
/* Importar el controlador del recurso Instants para acceder a sus MWs. */
const instantController = require('../controllers/instant');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

/* Contact page. */
router.get('/contact', (req, res, next) => {
  res.render('contact');
});

// Autoload for routes using :instantId
router.param('instantId', instantController.load);


// Routes for the resource /instants
router.get('/instants',                        instantController.index);
router.get('/instants/:instantId(\\d+)',       instantController.show);
router.get('/instants/new',                    instantController.new);
router.post('/instants',                       instantController.create);
router.get('/instants/:instantId(\\d+)/edit',  instantController.edit);
router.put('/instants/:instantId(\\d+)',       instantController.update);
router.delete('/instants/:instantId(\\d+)',    instantController.destroy);

module.exports = router;
