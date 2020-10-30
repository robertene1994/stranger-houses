module.exports = (app, express) => {
    let userSession = express.Router();

    userSession.use((req, _res, next) => {
        if (!req.args)
            req.args = {};
        if (req.session.user)
            req.args.user = req.session.user;
        next();
    });

    app.use(userSession);

    userSession = express.Router();
    userSession.use((req, res, next) => {
        if (req.session.user)
            next();
        else
            res.redirect("/");
    });

    app.get("/property/add", userSession);
    app.get("/property/myads", userSession);
    app.post("/property/save", userSession);
    app.get("/property/delete/:id", userSession);
    app.get("/user/userprofile", userSession);
    app.post("/user/update/:id", userSession);
};
