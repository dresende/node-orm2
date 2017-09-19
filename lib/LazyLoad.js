var Promise  = require("bluebird");

var LAZY_METHOD_NAMES = ["get", "remove", "set"];

var extend = function (Instance, Model, properties) {
  for (var k in properties) {
    if (properties[k].lazyload === true) {
      addLazyLoadProperty(properties[k].lazyname || k, Instance, Model, k);
    }
  }
};

var conditionAssign = function (instance, model) {
  var conditions = {};
  conditions[model.id] = instance[model.id];
  return conditions;
};

function addLazyLoadProperty(name, Instance, Model, property) {
  var method = ucfirst(name);
  var promiseFunctionPostfix = Model.settings.get('promiseFunctionPostfix');
  var functionNames = {
    get: {
      callback : "get" + method,
      promise  : "get" + method + promiseFunctionPostfix
    },
    remove: {
      callback : "remove" + method,
      promise  : "remove" + method + promiseFunctionPostfix
    },
    set: {
      callback : "set" + method,
      promise  : "set" + method + promiseFunctionPostfix
    }
  };

  Object.defineProperty(Instance, functionNames.get.callback, {
    value: function (cb) {
      var conditions = conditionAssign(Instance, Model);
      
      Model.find(conditions, { identityCache: false }).only(Model.id.concat(property)).first(function (err, item) {
        return cb(err, item ? item[property] : null);
      });

      return this;
    },
    enumerable: false
  });

  Object.defineProperty(Instance, functionNames.remove.callback, {
    value: function (cb) {
      var conditions = conditionAssign(Instance, Model);
      
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

  Object.defineProperty(Instance, functionNames.set.callback, {
    value: function (data, cb) {
      var conditions = conditionAssign(Instance, Model);
      
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

  for(var i = 0; i < LAZY_METHOD_NAMES.length; i++) {
    var methodName = LAZY_METHOD_NAMES[i];
    Object.defineProperty(Instance, functionNames[methodName].promise, {
      value: Promise.promisify(Instance[functionNames[methodName].callback]),
      enumerable: false
    });
  }
}

function ucfirst(text) {
  return text[0].toUpperCase() + text.substr(1).toLowerCase();
}

exports.extend = extend;