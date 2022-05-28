var createError = require('http-errors');
var express = require('express');
var path = require('path');
require('dotenv').config();
const session = require('express-session');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
var uid = require('uid-safe');
require('dotenv').config();
app.disable('etag');

const SECRET_KEY = process.env.SECRET_KEY;

var auth  = require('./routes/auth').router;
var cors = require('cors');
const { type } = require('os');

// view engine setup
app.use(cors());
app.set('views', path.join(__dirname, 'views'));//setting templates path
app.set('view engine', 'jade');
app.use(logger('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));



app.use(cookieParser()); //not needed since session() includes it \

/*app.use(session({
    secret: [SECRET_KEY]
   
}));

app.set('trust proxy', 1) // trust first proxy
*/


app.use(session({
    name: "session-id",
  secret: [SECRET_KEY], //can add multiple keys later; first one is checked
    resave: true,
    saveUninitialized: true,
    genid:   function (req) {
       return  uid.sync(18)   
    }
    , cookie: { httpOnly: true }
}));

app.use('/auth', auth);
 

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
