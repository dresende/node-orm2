var Promise  = require("bluebird");
var Settings = require("./Settings");

var extend = function (Instance, Model, properties) {
  for (var k in properties) {
    if (properties[k].lazyload === true) {
      addLazyLoadProperty(properties[k].lazyname || k, Instance, Model, k);
    }
  }
};

function addLazyLoadProperty(name, Instance, Model, property) {
  var method = ucfirst(name);
  var promiseFunctionPrefix = Settings.defaults().promiseFunctionPrefix;
  var funcNamesObj = {
    get: {
      callbackFuncName: "get" + method,
      promiseFuncName: "get" + method + promiseFunctionPrefix
    },
    remove: {
      callbackFuncName: "remove" + method,
      promiseFuncName: "remove" + method + promiseFunctionPrefix
    },
    set: {
      callbackFuncName: "set" + method,
      promiseFuncName: "set" + method + promiseFunctionPrefix
    }
  }

  var conditions = {};
  conditions[Model.id] = Instance[Model.id];

  Object.defineProperty(Instance, funcNamesObj.get['callbackFuncName'], {
    value: function (cb) {

      Model.find(conditions, { identityCache: false }).only(Model.id.concat(property)).first(function (err, item) {
        return cb(err, item ? item[property] : null);
      });

      return this;
    },
    enumerable: false
  });

  Object.defineProperty(Instance, funcNamesObj.remove['callbackFuncName'], {
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

  Object.defineProperty(Instance, funcNamesObj.set['callbackFuncName'], {
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

  Object.defineProperty(Instance, funcNamesObj.get['promiseFuncName'], {
    value: Promise.promisify(Instance[funcNamesObj.get['callbackFuncName']]),
    enumerable: false
  });

  Object.defineProperty(Instance, funcNamesObj.remove['promiseFuncName'], {
    value: Promise.promisify(Instance[funcNamesObj.remove['callbackFuncName']]),
    enumerable: false
  });

  Object.defineProperty(Instance, funcNamesObj.set['promiseFuncName'], {
    value: Promise.promisify(Instance[funcNamesObj.set['callbackFuncName']]),
    enumerable: false
  });
}

function ucfirst(text) {
  return text[0].toUpperCase() + text.substr(1).toLowerCase();
}

exports.extend = extend;