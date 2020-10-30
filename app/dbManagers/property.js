const dbManager = {};

dbManager.init = (app) => {
    dbManager.client = app.get("mongo").MongoClient;
    dbManager.dbUrl = app.get("dbUri");
    dbManager.dbOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
};

dbManager.getPropertiesPage = (query, page, callback) => {
    dbManager.client.connect(dbManager.dbUrl, dbManager.dbOptions, (err, client) => {
        if (err) {
            callback(err);
            return;
        }

        client.db("stranger-houses").collection("properties").countDocuments((err, count) => {
            if (err) {
                callback(err);
                return;
            }

            client.db("stranger-houses").collection("properties").find(query)
                .skip((page - 1) * 4).limit(4).toArray((err, properties) => {
                    if (err)
                        callback(err);
                    else
                        callback(undefined, properties, count);
                    client.close();
                });
        });
    });
};

dbManager.getProperties = (query, callback) => {
    dbManager.client.connect(dbManager.dbUrl, dbManager.dbOptions, (err, client) => {
        if (err) {
            callback(err);
            return;
        }

        client.db("stranger-houses").collection("properties").find(query).toArray((err, properties) => {
            if (err)
                callback(err);
            else
                callback(undefined, properties);
            client.close();
        });
    });
};

dbManager.deleteProperty = (query, callback) => {
    dbManager.client.connect(dbManager.dbUrl, dbManager.dbOptions, (err, client) => {
        if (err) {
            callback(err);
            return;
        }

        client.db("stranger-houses").collection("properties").remove(query, (err, obj) => {
            if (err)
                callback(err);
            else
                callback(undefined, obj.result);
            client.close();
        });
    });
};

dbManager.saveProperty = (property, callback) => {
    dbManager.client.connect(dbManager.dbUrl, dbManager.dbOptions, (err, client) => {
        if (err) {
            callback(err);
            return;
        }

        client.db("stranger-houses").collection("properties").insertOne(property, (err, result) => {
            if (err)
                callback(err);
            else
                callback(undefined, result.ops[0]._id);
            client.close();
        });
    });
};

dbManager.updateProperty = (query, property, callback) => {
    dbManager.client.connect(dbManager.dbUrl, dbManager.dbOptions, (err, client) => {
        if (err) {
            callback(err);
            return;
        }

        client.db("stranger-houses").collection("properties").updateOne(query, {
            $set: property
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
