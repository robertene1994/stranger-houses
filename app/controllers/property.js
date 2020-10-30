const fs = require("fs"),
    path = require("path"),
    nodemailer = require("nodemailer"),
    propertyDbManager = require("./../dbManagers/property"),
    userDbManager = require("./../dbManagers/user"),
    controller = {};

controller.init = (app) => {
    controller.mongo = app.get("mongo");
    controller.swig = app.get("swig");
    controller.emailConfig = app.get("emailConfig");
    propertyDbManager.init(app);
    userDbManager.init(app);
};

controller.getProperties = (req, res) => {
    let query = {};
    if (req.query) {
        if (req.query.adType && req.query.adType.length > 0)
            query.adType = {
                $regex: ".*" + req.query.adType + ".*"
            };

        if (req.query.propertyType && req.query.propertyType.length > 0)
            query.propertyType = {
                $regex: ".*" + req.query.propertyType + ".*"
            };

        if (req.query.address && req.query.address.length > 0)
            query.address = {
                $regex: ".*" + req.query.address + ".*"
            };
    }

    let page = req.query.page !== undefined ? parseInt(req.query.page) : 1;

    propertyDbManager.getPropertiesPage(query, page, (err, properties, total) => {
        if (err) {
            req.args.message = {
                severity: "error",
                text: "¡Ha ocurrido un error inesperado en el proceso de recuperación de anuncios!"
            };
        } else {
            let lastPage = total % 4 > 0 ? total / 4 + 1 : total / 4;

            let pages = [];
            for (let i = page - 2; i <= page + 2; i++)
                if (i > 0 && i <= lastPage)
                    pages.push(i);

            req.args.properties = properties;
            req.args.pages = pages;
            req.args.actual = page;
        }
        res.send(controller.swig.renderFile("app/views/ads.view.html", req.args));
    });
};

controller.getUserProperties = (req, res) => {
    let query = {
        "ownerId": req.session.user._id.toString()
    };

    propertyDbManager.getProperties(query, (err, properties) => {
        if (err) {
            req.args.message = {
                severity: "error",
                text: "¡Ha ocurrido un error inesperado en el proceso de recuperación de sus anuncios!"
            };
        } else {
            req.args.properties = properties;
        }
        res.send(controller.swig.renderFile("app/views/myads.view.html", req.args));
    });
};

controller.getPropertyById = (req, res) => {
    let id = req.params.id;

    if (!id) {
        req.args.message = {
            severity: "error",
            text: "¡El id de la propiedad es obligatorio!"
        };
        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
    } else {
        let query = {
            "_id": controller.mongo.ObjectID(id)
        };

        propertyDbManager.getProperties(query, (err, properties) => {
            if (err) {
                req.args.message = {
                    severity: "error",
                    text: "¡Ha ocurrido un error insesperado mientras se recuperaba el anuncio!"
                };
            } else if (properties.length === 0) {
                req.args.message = {
                    severity: "error",
                    text: `¡No ha existe ninguna propiedad con el id ${id}!`
                };
            } else {
                req.args.property = properties[0];
                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
            }
        });
    }
};

controller.saveProperty = (req, res) => {
    let property = {
        ownerId: req.session.user._id.toString(),
        price: req.body.price,
        adType: req.body.adType,
        propertyType: req.body.propertyType,
        details: {
            area: req.body.area,
            bedrooms: req.body.bedrooms,
            bathrooms: req.body.bathrooms,
            includesParking: req.body.includesParking ? true : false,
            includesFurniture: req.body.includesFurniture ? true : false,
            allowsSmoking: req.body.allowsSmoking ? true : false,
            allowsPets: req.body.allowsPets ? true : false
        },
        address: `${req.body.address},${req.body.zipcode},${req.body.city},${req.body.state},${req.body.country}`,
        description: req.body.description,
        images: [],
        publishDate: new Date(),
        comments: []
    };
    property.lastUpdateDate = property.publishDate;

    propertyDbManager.saveProperty(property, (err, id) => {
        if (err) {
            req.args.message = {
                severity: "error",
                text: "¡Ha ocurrido un problema inesperado durante el proceso de creación del anuncio!"
            };
            res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
        } else if (!id) {
            req.args.message = {
                severity: "error",
                text: "¡Ha ocurrido un problema inesperado durante el proceso de almacenamiento del anuncio!"
            };
            res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
        } else {
            if (req.files && Object.keys(req.files).length < 1) {
                req.args.message = {
                    severity: "warning",
                    text: "¡Se requiere al menos una imágen para el anuncio!"
                };
                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
            } else {
                let dir = `app/public/ads/${id.toString()}`;

                createImageDirectory(dir, (err) => {
                    if (err) {
                        req.args.message = {
                            severity: "warning",
                            text: "¡Ha ocurrido un problema inesperado durante el proceso de publicación del anuncio!"
                        };
                        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
                    } else {
                        saveAllAdImages(dir, req.files, (err, images) => {
                            if (err) {
                                req.args.message = {
                                    severity: "warning",
                                    text: "¡Ha ocurrido un problema inesperado durante el proceso de publicación del anuncio!"
                                };
                                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
                            } else {
                                let query = {
                                    "_id": id
                                };

                                let property = {
                                    images: images
                                };

                                propertyDbManager.updateProperty(query, property, (err, result) => {
                                    if (err) {
                                        req.args.message = {
                                            severity: "warning",
                                            text: "¡Ha ocurrido un problema inesperado durante el proceso de publicación del anuncio!"
                                        };
                                    } else {
                                        req.args.message = {
                                            severity: "success",
                                            text: "¡El anuncio ha sido publicado con éxito!"
                                        };
                                        req.args.url = "/property/myads";
                                        res.send(req.args);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    });
};

function saveAllAdImages(dir, files, callback) {
    let images = [],
        numImages = 0;

    for (let name in files) {
        let image = files[name];
        let extension = image.name.substr(image.name.lastIndexOf(".") + 1);
        let url = `${dir}/${numImages++}.${extension}`;

        saveAdImage(url, image, (err) => { // jshint ignore:line
            if (err) {
                callback(err);
                return;
            } else {
                images.push(url.substring(11, url.length));
                if (images.length === numImages)
                    callback(undefined, images);
            }
        });
    }
}

controller.deletePropertyById = (req, res) => {
    let id = req.params.id;

    if (!id) {
        req.args.message = {
            severity: "error",
            text: "¡El id de la propiedad es obligatorio!"
        };
        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
    } else {
        let query = {
            "_id": controller.mongo.ObjectID(id)
        };

        propertyDbManager.deleteProperty(query, (err, properties) => {
            if (err) {
                req.args.message = {
                    severity: "error",
                    text: "¡Ha ocurrido un problema inesperado durante el proceso de eliminación del anuncio!"
                };
                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
            } else if (properties.n === 0) {
                req.args.message = {
                    severity: "error",
                    text: `¡No ha existe ninguna propiedad con el id ${id}!`
                };
                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
            } else {
                req.args.message = {
                    severity: "success",
                    text: "¡El anuncio ha sido eliminado con éxito!"
                };
                req.args.url = "/property/myads";
                res.send(req.args);
            }
        });
    }
};

controller.getAddPropertyForm = (req, res) => {
    res.send(controller.swig.renderFile("app/views/new-property.view.html", req.args));
};

controller.addPropertyComment = (req, res) => {
    let id = req.params.id;

    if (!id) {
        req.args.message = {
            severity: "error",
            text: "¡El id de la propiedad es obligatorio!"
        };
        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
    } else {
        let query = {
            "_id": controller.mongo.ObjectID(id)
        };

        propertyDbManager.getProperties(query, (err, properties) => {
            if (err) {
                req.args.message = {
                    severity: "error",
                    text: "¡Ha ocurrido un error insesperado mientras se recuperaba el anuncio!"
                };
                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
            } else if (properties.length === 0) {
                req.args.message = {
                    severity: "error",
                    text: `¡No ha existe ninguna propiedad con el id ${id}!`
                };
                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
            } else {
                let comment = {
                    userId: req.session.user._id.toString(),
                    comment: req.body.comment
                };

                let comments = properties[0].comments ? properties[0].comments : [];
                comments.push(comment);

                let property = {
                    comments: comments
                };

                propertyDbManager.updateProperty(query, property, (err, result) => {
                    if (err) {
                        req.args.message = {
                            severity: "warning",
                            text: "¡Ha ocurrido un problema inesperado durante el proceso de publicación del comentario para el anuncio!"
                        };
                        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
                    } else {
                        req.args.message = {
                            "severity": "success",
                            "text": "Tu mensaje se ha publicado con éxito."
                        }
                        res.send(req.args);
                    }
                });
            }
        });
    }
};

controller.contactPropertyOwner = (req, res) => {
    let id = req.params.id;

    if (!id) {
        req.args.message = {
            severity: "error",
            text: "¡El id de la propiedad es obligatorio!"
        };
        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
    } else {
        let query = {
            "_id": controller.mongo.ObjectID(id)
        };

        propertyDbManager.getProperties(query, (err, properties) => {
            if (err) {
                req.args.message = {
                    severity: "error",
                    text: "¡Ha ocurrido un error insesperado mientras se recuperaba el anuncio!"
                };
                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
            } else if (properties.length === 0) {
                req.args.message = {
                    severity: "error",
                    text: `¡No ha existe ninguna propiedad con el id ${id}!`
                };
                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
            } else {
                let query = {
                    "_id": controller.mongo.ObjectID(properties[0].ownerId)
                };

                userDbManager.getUsers(query, (err, users) => {
                    if (err) {
                        req.args.message = {
                            severity: "error",
                            text: "¡Ha ocurrido un error inesperado durante el proceso de contacto con el propietario del anuncio!"
                        };
                        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
                    } else if (!users || users.length === 0) {
                        req.args.message = {
                            severity: "error",
                            text: "¡El id del propietario no corresponde a ningún usuario!"
                        };
                        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
                    } else {
                        let propertyOwner = users[0],
                            user = req.session.user,
                            smtpTransport = nodemailer.createTransport(controller.emailConfig);

                        sendEmailToPropertyOwner(id, req.body.comment, propertyOwner, user, smtpTransport, (err) => {
                            if (err) {
                                req.args.message = {
                                    severity: "error",
                                    text: "¡Ha ocurrido un error inesperado durante el proceso de contacto con el propietario del anuncio!"
                                };
                                res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
                            } else {
                                sendConfirmationEmailToUser(id, req.body.comment, propertyOwner, user, smtpTransport, (err) => {
                                    if (err) {
                                        req.args.message = {
                                            severity: "error",
                                            text: "¡Ha ocurrido un error inesperado durante el proceso de contacto con el propietario del anuncio!"
                                        };
                                        res.send(controller.swig.renderFile("app/views/property.view.html", req.args));
                                    } else {
                                        req.args.message = {
                                            "severity": "success",
                                            "text": "Se ha enviado un mensaje de correo electrónico al propietario de este inmueble con tu solicitud. Revisa tu e-mail en busca de la confirmación de envío."
                                        }
                                        res.send(req.args);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
};

function sendEmailToPropertyOwner(id, comment, propertyOwner, user, smtpTransport, callback) {
    let mailOptions = {
        from: user.email,
        to: propertyOwner.email,
        subject: "[Stranger Houses] Nuevo correo a través del formulario de contacto de su anuncio",
        text: `Nuevo correo del usuario ${user.firstName} ${user.lastName} a través de su anuncio con el id ${id}.\n\n"${comment}"`
    };

    smtpTransport.sendMail(mailOptions, (err, info) => {
        if (err)
            callback(err);
        else
            callback(undefined);
    });
}

function sendConfirmationEmailToUser(id, comment, propertyOwner, user, smtpTransport, callback) {
    let mailOptions = {
        from: propertyOwner.email,
        to: user.email,
        subject: `[Stranger Houses] Confirmación de contacto`,
        text: `Confirmación de contacto con el propietario del anuncio con el id ${id}.\n\n"${comment}"`
    };

    smtpTransport.sendMail(mailOptions, (err, info) => {
        if (err)
            callback(err);
        else
            callback(undefined);
    });
}

function createImageDirectory(dir, callback) {
    fs.access(dir, (err) => {
        fs.mkdir(dir, (err) => {
            if (err) {
                callback(err);
                return;
            }
            callback(undefined);
        });
    });
}

function saveAdImage(url, image, callback) {
    image.mv(url, (err) => {
        if (err) {
            callback(err);
            return;
        }
        callback(undefined);
    });
}

function deleteAdImage(url) {
    fs.unlink(url, (err) => {});
}

function deleteImageDirectory(dir) {
    fs.access(dir, (err) => {
        if (err)
            return;

        fs.readdir(dir, (err, files) => {
            if (err)
                return;

            if (files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    deleteAdImage(path.join(dir, files[i]));
                    if (i === files.length - 1)
                        fs.rmdir(dir, (err) => {});
                }
            } else
                fs.rmdir(dir, (err) => {});
        });
    });
}

module.exports = controller;
