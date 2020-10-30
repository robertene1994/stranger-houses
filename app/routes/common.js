const commonController = require("./../controllers/common"),
    root = "/";

module.exports = (app) => {
    commonController.init(app);

    app.get(`${root}`, commonController.getRoot);
};