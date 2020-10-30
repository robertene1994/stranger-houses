const dbManager = {};

dbManager.init = (app) => {
    dbManager.client = app.get("mongo").MongoClient;
    dbManager.dbUrl = app.get("dbUri");
    dbManager.dbOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
};

dbManager.saveUser = (user, callback) => {
    dbManager.client.connect(dbManager.dbUrl, dbManager.dbOptions, (err, client) => {
        if (err) {
            callback(err);
            return;
        }

        client.db("stranger-houses").collection("users").insertOne(user, (err, result) => {
            if (err)
                callback(err);
            else
                callback(undefined, result.ops[0]._id);
            client.close();
        });
    });
};

dbManager.getUsers = (query, callback) => {
    dbManager.client.connect(dbManager.dbUrl, dbManager.dbOptions, (err, client) => {
        if (err) {
            callback(err);
            return;
        }

        client.db("stranger-houses").collection("users").find(query).toArray(function (err, users) {
            if (err)
                callback(err);
            else
                callback(undefined, users);
            client.close();
        });
    });
};

dbManager.updateUser = (query, user, callback) => {
    dbManager.client.connect(dbManager.dbUrl, dbManager.dbOptions, (err, client) => {
        if (err) {
            callback(err);
            return;
        }

        client.db("stranger-houses").collection("users").updateOne(query, {
            $set: user
        }, (err, result) => {
            if (err)
                callback(err);
            else
                callback(undefined, result);
            client.close();
        });
    });
};

module.exports = dbManager;
