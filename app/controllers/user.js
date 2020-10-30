const userDbManager = require("./../dbManagers/user"),
    controller = {};

controller.init = (app) => {
    controller.swig = app.get("swig");
    controller.crypto = app.get("crypto");
    controller.mongo = app.get("mongo");
    controller.sessionSecret = app.get("sessionSecret");
    userDbManager.init(app);
};

controller.doLogin = (req, res) => {
    if (req.session.user) {
        res.redirect("/property/myads");
        return;
    }

    let encrPassword = controller.crypto
        .createHmac("sha256", controller.sessionSecret)
        .update(req.body.password).digest("hex");

    let query = {
        email: req.body.email,
        password: encrPassword
    };

    userDbManager.getUsers(query, (err, users) => {
        if (err) {
            req.args.message = {
                severity: "error",
                text: "¡Ha ocurrido un error inesperado durante el proceso de inicio de sesión!"
            };
        } else if (!users || users.length === 0) {
            req.session.user = undefined;
            req.args.url = "/property/myads";
            req.args.message = {
                severity: "error",
                text: "¡El email y/o la contraseña son inválidos!"
            };
        } else {
            req.session.user = users[0];
            req.args.user = users[0];
            req.args.message = {
                "severity": "success",
                "text": `Bienvenido, ${users[0].firstName}`
            };
        }
        res.send(req.args);
    });
};

controller.doLogout = (req, res) => {
    req.session.user = undefined;
    req.args.message = {
        "severity": "success",
        "text": "Has cerrado la sesión con éxito. ¡Esperamos verte pronto de nuevo por aquí!"
    };
    req.args.url = "/";
    res.send(req.args);
};

controller.doSignin = (req, res) => {
    let query = {
        email: req.body.email
    };
    userDbManager.getUsers(query, (err, users) => {
        if (err) {
            res.send({
                message: {
                    severity: "error",
                    text: "¡Ha ocurrido un error insesperado durante el proceso de creación de cuenta!"
                }
            });
        } else if (users.length > 0) {
            res.send({
                message: {
                    severity: "warning",
                    text: "¡Ya existe en el sistema un usuario con este email! ¡Por favor, elija otro!"
                }
            });
        } else {
            let encrPassword = controller.crypto
                .createHmac("sha256", controller.sessionSecret)
                .update(req.body.password).digest("hex");

            let user = {
                email: req.body.email,
                password: encrPassword,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                gender: req.body.gender
            };

            userDbManager.saveUser(user, (err, id) => {
                if (err) {
                    res.send({
                        message: {
                            severity: "error",
                            text: "¡Ha ocurrido un error insesperado durante el proceso de creación de cuenta!"
                        }
                    });
                } else {
                    let query = {
                        email: req.body.email
                    };
                    userDbManager.getUsers(query, (err, users) => {
                        if (err) {
                            res.send({
                                message: {
                                    severity: "error",
                                    text: "¡Ha ocurrido un error inesperado durante el proceso de creación de cuenta!"
                                }
                            });
                        } else {
                            req.session.user = users[0];
                            res.send({
                                user: users[0],
                                url: "/property/ads",
                                message: {
                                    severity: "success",
                                    text: "¡Su cuenta ha sido creada con éxito! ¡Puede iniciar sesión en el sistema!"
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

controller.getUserProfileForm = (req, res) => {
    res.send(controller.swig.renderFile("app/views/user-profile.view.html", req.args));
};

controller.updateUserProfile = (req, res) => {
    let id = req.params.id;
    if (!id) {
        req.args.message = {
            severity: "error",
            text: "¡El id del usuario es obligatorio!"
        };
        res.send(controller.swig.renderFile("app/views/user-profile.view.html", req.args));
    } else {
        let queryId = {
            "_id": controller.mongo.ObjectID(id)
        };

        userDbManager.getUsers(queryId, (err, users) => {
            if (err) {
                res.send({
                    message: {
                        severity: "error",
                        text: "¡Ha ocurrido un error insesperado durante el proceso de creación de cuenta!"
                    }
                });
            } else if (users.length === 0) {
                res.send({
                    message: {
                        severity: "warning",
                        text: `¡No ha existe ningún usuario con el id ${id}!`
                    }
                });
            } else {
                let queryEmail = {
                    "_id": req.body.email
                };
                userDbManager.getUsers(queryEmail, (err, users) => {
                    if (err) {
                        res.send({
                            message: {
                                severity: "error",
                                text: "¡Ha ocurrido un error insesperado durante el proceso de creación de cuenta!"
                            }
                        });
                    } else if (users.length > 0) {
                        res.send({
                            message: {
                                severity: "warning",
                                text: "¡Ya existe en el sistema un usuario con este email! ¡Por favor, elija otro!"
                            }
                        });
                    } else {
                        let encrPassword = controller.crypto
                            .createHmac("sha256", controller.sessionSecret)
                            .update(req.body.password).digest("hex");

                        let user = {
                            email: req.body.email,
                            password: encrPassword,
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            gender: req.body.gender
                        };

                        userDbManager.updateUser(queryId, user, (err, result) => {
                            if (err) {
                                res.send({
                                    message: {
                                        severity: "error",
                                        text: "¡Ha ocurrido un error insesperado durante el proceso de actualización del perfil del usuario!"
                                    }
                                });
                            } else {
                                user._id = controller.mongo.ObjectID(id);
                                req.session.user = user;
                                req.args.url = "/user/userprofile";
                                req.args.message = {
                                    "severity": "success",
                                    "text": "Has modificado tu perfil con éxito"
                                };
                                res.send(req.args);
                            }
                        });
                    }
                });
            }
        });
    }
};

module.exports = controller;