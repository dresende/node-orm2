var _          = require('lodash');
var ORMError   = require("../Error");
var Settings   = require("../Settings");
var Singleton  = require("../Singleton");
var util       = require("../Utilities");
var Promise    = require("bluebird");

var ACCESSOR_METHODS = ["hasAccessor", "getAccessor", "setAccessor", "delAccessor"];

exports.prepare = function (db, Model, associations) {
  Model.extendsTo = function (name, properties, opts) {
    opts = opts || {};

    var assocName = opts.name || ucfirst(name);
    var association = {
      name           : name,
      table          : opts.table || (Model.table + '_' + name),
      reversed       : opts.reversed,
      autoFetch      : opts.autoFetch || false,
      autoFetchLimit : opts.autoFetchLimit || 2,
      field          : util.wrapFieldObject({
                         field: opts.field, model: Model, altName: Model.table
                       }) || util.formatField(Model, Model.table, false, false),
      getAccessor    : opts.getAccessor || ("get" + assocName),
      setAccessor    : opts.setAccessor || ("set" + assocName),
      hasAccessor    : opts.hasAccessor || ("has" + assocName),
      delAccessor    : opts.delAccessor || ("remove" + assocName)
    };

    var newproperties = _.cloneDeep(properties);
    for (var k in association.field) {
        newproperties[k] = association.field[k];
    }

    var modelOpts = _.extend(
      _.pick(opts, 'identityCache', 'autoSave', 'cascadeRemove', 'hooks', 'methods', 'validations'),
      {
        id        : Object.keys(association.field),
        extension : true,
      }
    );

    association.model = db.define(association.table, newproperties, modelOpts);
    association.model.hasOne(Model.table, Model, { extension: true, field: association.field });

    associations.push(association);

    Model["findBy" + assocName] = function () {
      var cb = null, conditions = null, options = {};

      for (var i = 0; i < arguments.length; i++) {
        switch (typeof arguments[i]) {
          case "function":
            cb = arguments[i];
            break;
          case "object":
            if (conditions === null) {
              conditions = arguments[i];
            } else {
              options = arguments[i];
            }
            break;
        }
      }

      if (conditions === null) {
        throw new ORMError(".findBy(" + assocName + ") is missing a conditions object", 'PARAM_MISMATCH');
      }

      options.__merge = {
        from  : { table: association.model.table, field: Object.keys(association.field) },
        to    : { table: Model.table, field: Model.id },
        where : [ association.model.table, conditions ],
        table : Model.table
      };
      options.extra = [];

      if (typeof cb == "function") {
        return Model.find({}, options, cb);
      }
      return Model.find({}, options);
    };

    return association.model;
  };
};

exports.extend = function (Model, Instance, Driver, associations, opts) {
  for (var i = 0; i < associations.length; i++) {
    extendInstance(Model, Instance, Driver, associations[i], opts);
  }
};

exports.autoFetch = function (Instance, associations, opts, cb) {
  if (associations.length === 0) {
    return cb();
  }

  var pending = associations.length;
  var autoFetchDone = function autoFetchDone() {
    pending -= 1;

    if (pending === 0) {
      return cb();
    }
  };

  for (var i = 0; i < associations.length; i++) {
    autoFetchInstance(Instance, associations[i], opts, autoFetchDone);
  }
};

function extendInstance(Model, Instance, Driver, association, opts) {
  var promiseFunctionPostfix = Model.settings.get('promiseFunctionPostfix');

  Object.defineProperty(Instance, association.hasAccessor, {
    value : function (cb) {
      if (!Instance[Model.id]) {
        cb(new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table }));
      } else {
        association.model.get(util.values(Instance, Model.id), function (err, extension) {
          return cb(err, !err && extension ? true : false);
        });
      }
      return this;
    },
    enumerable : false
  });
  Object.defineProperty(Instance, association.getAccessor, {
    value: function (opts, cb) {
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }

      if (!Instance[Model.id]) {
        cb(new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table }));
      } else {
        association.model.get(util.values(Instance, Model.id), opts, cb);
      }
      return this;
    },
    enumerable : false
  });
  Object.defineProperty(Instance, association.setAccessor, {
    value : function (Extension, cb) {
      Instance.save(function (err) {
        if (err) {
          return cb(err);
        }

        Instance[association.delAccessor](function (err) {
          if (err) {
            return cb(err);
          }

          var fields = Object.keys(association.field);

          if (!Extension.isInstance) {
            Extension = new association.model(Extension);
          }

          for (var i = 0; i < Model.id.length; i++) {
            Extension[fields[i]] = Instance[Model.id[i]];
          }

          Extension.save(cb);
        });
      });
      return this;
    },
    enumerable : false
  });
  Object.defineProperty(Instance, association.delAccessor, {
    value : function (cb) {
      if (!Instance[Model.id]) {
          cb(new ORMError("Instance not saved, cannot get extension", 'NOT_DEFINED', { model: Model.table }));
      } else {
        var conditions = {};
        var fields = Object.keys(association.field);

        for (var i = 0; i < Model.id.length; i++) {
            conditions[fields[i]] = Instance[Model.id[i]];
        }

        association.model.find(conditions, function (err, extensions) {
          if (err) {
            return cb(err);
          }

          var pending = extensions.length;

          for (var i = 0; i < extensions.length; i++) {
            Singleton.clear(extensions[i].__singleton_uid());
            extensions[i].remove(function () {
              if (--pending === 0) {
                return cb();
              }
            });
          }

          if (pending === 0) {
            return cb();
          }
        });
      }
      return this;
    },
    enumerable : false
  });

  for (var i = 0; i < ACCESSOR_METHODS.length; i++) {
    var name = ACCESSOR_METHODS[i];
    var asyncName = association[name] + promiseFunctionPostfix;
    Object.defineProperty(Instance, asyncName, {
      value: Promise.promisify(Instance[association[name]]),
      enumerable: false,
      writable: true
    });
  }
}

function autoFetchInstance(Instance, association, opts, cb) {
  if (!Instance.saved()) {
    return cb();
  }

  if (!opts.hasOwnProperty("autoFetchLimit") || !opts.autoFetchLimit) {
    opts.autoFetchLimit = association.autoFetchLimit;
  }

  if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
    return cb();
  }

  if (Instance.isPersisted()) {
    Instance[association.getAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 }, function (err, Assoc) {
      if (!err) {
        Instance[association.name] = Assoc;
      }

      return cb();
    });
  } else {
    return cb();
  }
}

function ucfirst(text) {
  return text[0].toUpperCase() + text.substr(1);
}
