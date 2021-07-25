//Importar MWs utilizados de express instalados como paquetes npm:
// http://expressjs.com/en/resources/middleware.html
var createError = require('http-errors');
var express = require('express');
var path = require('path');
// importamos serve-favicon
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// Importar MW routers generados del directorio ./routes
var indexRouter = require('./routes/index');
// Crear aplicación express.
var app = express();

// view engine setup
// Define views como directorio que contiene vistas.
app.set('views', path.join(__dirname, 'views'));
// Instalar renderizador de vistas EJS.
app.set('view engine', 'ejs');
// Instalamos serve-favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// Instalar MWs instalados como paquetes npm.
// Estos procesan partes de req o res: http://expressjs.com/en/resources/middleware.html
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Instalar MW routers generados:
// indexRouter atiende la ruta: /
// usersRouter atiende la ruta: /users
app.use('/', indexRouter);

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
