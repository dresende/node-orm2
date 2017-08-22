var Promise = require("bluebird");

exports.extend = function (Instance, Model, properties) {
    for (var k in properties) {
        if (properties[k].lazyload === true) {
            addLazyLoadProperty(properties[k].lazyname || k, Instance, Model, k);
        }
    }
};

exports.extendAsync = function (Instance, Model, properties) {
    // TODO:
    for (var k in properties) {
        if (properties[k].lazyload) {
            addLazyLoadPropertyAsync(properties[k].lazyname || k, Instance, Model, k);
        }
    }
};

function addLazyLoadPropertyAsync(name, Instance, Model, property) {
    var method = ucfirst(name);
    Object.defineProperty(Instance, "get" + method, {
        value: function () {
            return new Promise (function (resolve, reject) {
                var conditions = {};
                conditions[Model.id] = Instance[Model.id];

                Model.find(conditions, {identityCache: false}).only(Model.id.concat(property)).first(function (err, item) {
                    if (err) {
                        return reject (err);
                    }
                    resolve(item ? item[property] : null);
                });

            });
            // return this;
        },
        enumerable: false
    });

    Object.defineProperty(Instance, "remove" + method, {
        value: function () {
            return new Promise (function (resolve, reject) {
                var conditions = {};
                conditions[Model.id] = Instance[Model.id];

                Model.find(conditions, {identityCache: false}).only(Model.id.concat(property)).first(function (err, item) {
                    if (err) {
                        return reject(err);
                    }
                    if (!item) {
                        return reject(null);
                    }

                    item[property] = null;

                    return item.save(resolve);
                });

                // return this;
            });
        },
        enumerable: false
    });
    Object.defineProperty(Instance, "set" + method, {
        value: function (data) {
            return new Promise (function (resolve, reject) {
                var conditions = {};
                conditions[Model.id] = Instance[Model.id];

                Model.find(conditions, {identityCache: false}).first(function (err, item) {
                    if (err) {
                        return reject(err);
                    }
                    if (!item) {
                        return reject(null);
                    }

                    item[property] = data;

                    return item.save(resolve);
                });

                // return this;
            });
        },
        enumerable: false
    });
};

function addLazyLoadProperty(name, Instance, Model, property) {
    var method = ucfirst(name);

    Object.defineProperty(Instance, "get" + method, {
        value: function (cb) {
            var conditions = {};
            conditions[Model.id] = Instance[Model.id];

            Model.find(conditions, { identityCache: false }).only(Model.id.concat(property)).first(function (err, item) {
                return cb(err, item ? item[property] : null);
            });

            // return this;
        },
        enumerable: false
    });

    Object.defineProperty(Instance, "remove" + method, {
        value: function (cb) {
            var conditions = {};
            conditions[Model.id] = Instance[Model.id];

            Model.find(conditions, { identityCache: false }).only(Model.id.concat(property)).first(function (err, item) {
                if (err) {
                    return cb(err);
                }
                if (!item) {
                    return cb(null);
                }

                item[property] = null;

                return item.save(cb);
            });

            return this;
        },
        enumerable: false
    });
    Object.defineProperty(Instance, "set" + method, {
        value: function (data, cb) {
            var conditions = {};
            conditions[Model.id] = Instance[Model.id];

            Model.find(conditions, { identityCache: false }).first(function (err, item) {
                if (err) {
                    return cb(err);
                }
                if (!item) {
                    return cb(null);
                }

                item[property] = data;

                return item.save(cb);
            });

            return this;
        },
        enumerable: false
    });
}

function ucfirst(text) {
    return text[0].toUpperCase() + text.substr(1).toLowerCase();
}