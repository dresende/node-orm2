var Promise = require("bluebird");

exports.extend = function (Instance, Model, properties) {
  for (var k in properties) {
    if (properties[k].lazyload === true) {
      addLazyLoadProperty(properties[k].lazyname || k, Instance, Model, k);
    }
  }
};

function addLazyLoadProperty(name, Instance, Model, property) {
  var method = ucfirst(name);

  var conditions = {};
  conditions[Model.id] = Instance[Model.id];

  Object.defineProperty(Instance, "get" + method, {
    value: function (cb) {

      Model.find(conditions, { identityCache: false }).only(Model.id.concat(property)).first(function (err, item) {
        return cb(err, item ? item[property] : null);
      });

      return this;
    },
    enumerable: false
  });

  Object.defineProperty(Instance, "remove" + method, {
    value: function (cb) {

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

  Object.defineProperty(Instance, "get" + method + 'Async', {
    value: function () {
      return new Promise (function (resolve, reject) {
        Model.find(conditions, {identityCache: false}).only(Model.id.concat(property)).first(function (err, item) {
          if (err) return reject (err);
          return resolve(item ? item[property] : null);
        });
      });
    },
    enumerable: false
  });

  Object.defineProperty(Instance, "remove" + method + 'Async', {
    value: function () {
      return new Promise (function (resolve, reject) {
        Model.find(conditions, {identityCache: false}).only(Model.id.concat(property)).first(function (err, item) {
          if (err) return reject(err);

          if (!item) return resolve(null);

          item[property] = null;
          return item.save(function (err, data) { //TODO: change save() to async
            if (err) return reject(err);
            return resolve(data);
          });
        });
      });
    },
    enumerable: false
  });

  Object.defineProperty(Instance, "set" + method + 'Async', {
    value: function (data) {
      return new Promise (function (resolve, reject) {
        Model.find(conditions, {identityCache: false}).first(function (err, item) {
          if (err) return reject(err);

          if (!item) return resolve(null);

          item[property] = data;

          return item.save(function (err, data) { //TODO: change save() to async
            if (err) return reject(err);
            return resolve(data);
          });
        });
      });
    },
    enumerable: false
  });
}

function ucfirst(text) {
  return text[0].toUpperCase() + text.substr(1).toLowerCase();
}