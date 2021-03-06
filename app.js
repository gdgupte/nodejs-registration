const express = require("express");
const path = require("path");
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');

// COnnect to DB
mongoose.connect(config.database);
let db = mongoose.connection;

// CHeck DB connection
db.once('open', function(){
    console.log("Connected to MongoDB");
});

// Check for DB errors
db.on('error', function(err){
    console.log(err);
});

// Init App
var app = express();


// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

//Set public folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
  }));

// Express-messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express validator middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value){
        var namespace = param.split('.'),
        root = namespace.shift(),
        formParam = root;

        while(namespace.length){
            formParam += '[' + namespace.shift() + ']';
        }
        return{
            param: formParam, 
            msg: msg, 
            value: value
        };
    }
}));

// Passport config
require('./config/passport')(passport);
// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
    res.locals.user = req.user || null;
    next();
});

// Bring in models
var Article = require('./models/article');

// Load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Home Route
app.get('/', function(req, res){
    Article.find({}, function(err, articles){
        if (err){
            console.log(err);
        }

        else{
            res.render('index', {
                title: 'Articles',
                articles: articles
            });
        }
    });
});

// Route files
let articles = require('./routes/articles');
let users = require('./routes/users');
app.use('/articles', articles);
app.use('/users', users);

// STart Server
app.listen(3000, function(){
    console.log("Server started on port 3000...");
});