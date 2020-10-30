const propertyController = require("./../controllers/property"),
    root = "/property";

module.exports = (app) => {
    propertyController.init(app);

    app.get(`${root}/ads`, propertyController.getProperties);
    app.get(`${root}/myads`, propertyController.getUserProperties);
    app.get(`${root}/add`, propertyController.getAddPropertyForm);
    app.get(`${root}/find/:id`, propertyController.getPropertyById);
    app.post(`${root}/save`, propertyController.saveProperty);
    app.get(`${root}/delete/:id`, propertyController.deletePropertyById);
    app.post(`${root}/addcomment/:id`, propertyController.addPropertyComment);
    app.post(`${root}/contact/:id`, propertyController.contactPropertyOwner);
};