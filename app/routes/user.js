const userController = require("./../controllers/user"),
    root = "/user";

module.exports = (app) => {
    userController.init(app);

    app.post(`${root}/login`, userController.doLogin);
    app.get(`${root}/logout`, userController.doLogout);
    app.post(`${root}/signin`, userController.doSignin);
    app.get(`${root}/userprofile`, userController.getUserProfileForm);
    app.post(`${root}/update/:id`, userController.updateUserProfile);
};
