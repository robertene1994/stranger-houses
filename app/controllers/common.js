const controller = {};

controller.init = (app) => {
    controller.swig = app.get("swig");
};

controller.getRoot = (req, res) => {
    res.send(controller.swig.renderFile("app/views/index.view.html", req.args));
};

module.exports = controller;
