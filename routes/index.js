var express = require('express');
var router = express.Router();
/* Importar el controlador del recurso Instants para acceder a sus MWs. */
const instantController = require('../controllers/instant');
const userController = require('../controllers/user');
const sessionController = require('../controllers/session');

//-----------------------------------------------------------

// Routes for the resource /login

// autologout
router.all('*',sessionController.checkLoginExpires);

// login form
router.get('/login', sessionController.new);

// create login session
router.post('/login',
    sessionController.create,
    sessionController.createLoginExpires);

    
// Authenticate with OAuth 2.0 at Github
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  router.get('/auth/github',
      sessionController.authGitHub);
  router.get('/auth/github/callback',
      sessionController.authGitHubCB,
      sessionController.createLoginExpires);
}

// Authenticate with OAuth 1.0 at Twitter
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  router.get('/auth/twitter',
      sessionController.authTwitter);
  router.get('/auth/twitter/callback',
      sessionController.authTwitterCB,
      sessionController.createLoginExpires);
}

// Authenticate with OAuth 2.0 at Twitter
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/auth/google',
      sessionController.authGoogle);
  router.get('/auth/google/callback',
      sessionController.authGoogleCB,
      sessionController.createLoginExpires);
}

// Authenticate with OAuth 2.0 at Linkedin
if (process.env.LINKEDIN_API_KEY && process.env.LINKEDIN_SECRET_KEY) {
  router.get('/auth/linkedin',
      sessionController.authLinkedin);
  router.get('/auth/linkedin/callback',
      sessionController.authLinkedinCB,
      sessionController.createLoginExpires);
}

// logout - close login session
router.delete('/login', sessionController.destroy);

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
//   /new, /edit, /play, /check, /login or /:id.
router.get(
    [
      '/',
      '/contact',
      '/users',
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

router.param('userId', userController.load);

// Routes for the resource /users
router.get('/users',                    userController.index);
router.get('/users/:userId(\\d+)',      userController.show);
router.get('/users/new',                userController.new);
router.post('/users',                   userController.create);
router.get('/users/:userId(\\d+)/edit', userController.isLocalRequired, userController.edit);
router.put('/users/:userId(\\d+)',      userController.isLocalRequired, userController.update);
router.delete('/users/:userId(\\d+)',   userController.destroy);

// Routes for the resource /instants
router.get('/instants',                        instantController.index);
router.get('/instants/:instantId(\\d+)',       instantController.show);
router.get('/instants/new',                    instantController.new);
router.post('/instants',                       instantController.create);
router.get('/instants/:instantId(\\d+)/edit',  instantController.edit);
router.put('/instants/:instantId(\\d+)',       instantController.update);
router.delete('/instants/:instantId(\\d+)',    instantController.destroy);

module.exports = router;
