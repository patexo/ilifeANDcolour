//Importar MWs utilizados de express instalados como paquetes npm:
// http://expressjs.com/en/resources/middleware.html
var createError = require('http-errors');
var express = require('express');
var path = require('path');
// importamos serve-favicon
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// importamos express-session
var session = require('express-session');
// Importar connect-session-sequelize para configurar la gestión de sesiones con la tabla Sessions.
var SequelizeStore = require('connect-session-sequelize')(session.Store);
// importamos express-partials
var partials = require('express-partials');
// importamos express-flash
var flash = require('express-flash');
// importar method-override
var methodOverride = require('method-override');
// Importar MW redirectToHTTPS.
// redirectToHTTPS var redirectToHTTPS = require('express-http-to-https').redirectToHTTPS
var cors = require('cors');
// El paquete dotenv debe importarse en app.js y configurarse para que muestre las variables definidas en el fichero .env en process.env.
require('dotenv').config();
// importar passport para login session y logout
const passport = require('passport');
// Importar MW routers generados del directorio ./routes
var apiRouter = require('./routes/api');
var htmlRouter = require('./routes/index');
// Crear aplicación express.
var app = express();

// view engine setup
// Define views como directorio que contiene vistas.
app.set('views', path.join(__dirname, 'views'));
// Instalar renderizador de vistas EJS.
app.set('view engine', 'ejs');

// Instalar MW redirectToHTTPS excluyendo redirigir cuando el servidor está instalado en localhost en cualquier puerto.
// Redirect HTTP to HTTPS.
// Don't redirect if the hostname is localhost:port (port=3000,5000)
// redirectToHTTPS app.use(redirectToHTTPS([/localhost:(\d{4})/], [], 301));

// Instalamos serve-favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// Instalar MWs instalados como paquetes npm.
// Estos procesan partes de req o res: http://expressjs.com/en/resources/middleware.html
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Configuracion de la session para almacenarla en BBDD usando Sequelize.
var sequelize = require("./models");
var sessionStore = new SequelizeStore({
  db: sequelize,
  table: "Session",
  checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds. (15 minutes)
  expiration: 4 * 60 * 60 * 1000  // The maximum age (in milliseconds) of a valid session. (4 hours)
});
app.use(session({
  secret: "iLiveANDColour",
  store: sessionStore,
  resave: false,
  saveUninitialized: true
}));

// Configuracion de la session para almacenarla en BBDD Redis.
app.use(session({secret: "iLiveANDColour",  //secret: semilla de cifrado de la cookie
  resave: false,    //resave, saveUninitialized: fuerzan guardar siempre sesiones aunque no estén inicializadas
  saveUninitialized: true}));

// instalar method-override
app.use(methodOverride('_method', {methods: ["POST", "GET"]}));
app.use(express.static(path.join(__dirname, 'public')));
// instalamos express-partials
app.use(partials());
// instalamos express-flash
app.use(flash());

// Inicializa Passport y define loginUser como la propiedad de req que contiene al usuario autenticado si existe
app.use(passport.initialize( {
  userProperty: 'loginUser' // defaults to 'user' if omitted
}));
// Conecta la session-delogin con la de cliente.
app.use(passport.session());

// Control de Acceso HTTP (CORS)
app.use(cors());

// req.loginUser se copia a res.locals.loginUser para hacerlo visible en todas vistas (para layout.ejs).
// Dynamic Helper:
app.use(function(req, res, next) {

  // To use req.loginUser in the views
  res.locals.loginUser = req.loginUser && {
      id: req.loginUser.id,
      displayName: req.loginUser.displayName,
      isAdmin: req.loginUser.isAdmin
  };

  // To use req.url in the views
  res.locals.url = req.url;

  next();
});

// Instalar MW routers generados:
// indexRouter atiende la ruta: /
// usersRouter atiende la ruta: /users
// Routes mounted at '/api'.
app.use('/api', apiRouter);

// Routes mounted at '/'. (no starting with /api/)
app.use(/^(?!\/api\/)/, htmlRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
