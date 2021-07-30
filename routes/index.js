var express = require('express');
var router = express.Router();
/* Importar el controlador del recurso Instants para acceder a sus MWs. */
const instantController = require('../controllers/instant');

//-----------------------------------------------------------

// History: Restoration routes.

// El botón Cancel envía la solicitud GET /goback. Esta redirecciona a la última ruta guardada con saveBack, es decir la ruta /quizzes.
// Redirection to the saved restoration route.
function redirectBack(req, res, next) {
  const url = req.session.backURL || "/";
  delete req.session.backURL;
  res.redirect(url);
}

router.get('/goback', redirectBack);

//El MW saveBack guarda en la propiedad req.session.backURL la ruta /quizzes cuando pasa a mostrar la lista de quizzes, pero no guardará /quizzes/new.
// Save the route that will be the current restoration route.
function saveBack(req, res, next) {
  req.session.backURL = req.url;
  next();
}

// Restoration routes are GET routes that do not end in:
//   /new, /edit, /play, /check, or /:id.
router.get(
    [
      '/',
      '/contact',
      '/instants'
    ],
    saveBack);

//-----------------------------------------------------------

/*

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
