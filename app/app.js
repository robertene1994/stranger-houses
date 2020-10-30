const express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    expressSession = require("express-session"),
    mongo = require("mongodb"),
    dotenv = require("dotenv"),
    swig = require("swig"),
    crypto = require("crypto"),
    fileUpload = require("express-fileupload"),
    port = process.env.PORT || '4200';

// Dotenv
dotenv.config();

// Variables
app.set("port", port);
app.set("dbUri", process.env.DB_URI);
app.set("mongo", mongo);
app.set("sessionSecret", process.env.SESSION_SECRET);
app.set("crypto", crypto);
app.set("swig", swig);
app.set("emailConfig", {
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: process.env.EMAIL_CONFIG_AUTH_EMAIL,
        pass: process.env.EMAIL_CONFIG_AUTH_PASSWORD
    }
});

// Dependencies config
app.use(expressSession({
    secret: app.get("sessionSecret"),
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: false,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));
swig.setDefaults({
    cache: false
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(fileUpload());

// Routers
require("./routers/userSession")(app, express);

// Static
app.use(express.static(__dirname + "/public"));

// Routes
require("./routes/user")(app);
require("./routes/property")(app);
require("./routes/common")(app);

// Server
app.listen(app.get("port"), () => {
    console.log(`Server started on port ${app.get("port")}.`);
});
