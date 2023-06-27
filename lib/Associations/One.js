var _          = require("lodash");
var async      = require("async");
var util       = require("../Utilities");
var ORMError   = require("../Error");
var Accessors  = { "get": "get", "set": "set", "has": "has", "del": "remove" };
var Promise    = require("bluebird");

var ACCESSOR_METHODS = ["hasAccessor", "getAccessor", "setAccessor", "delAccessor"];

exports.prepare = function (Model, associations) {
  Model.hasOne = function () {
    var assocName;
    var assocTemplateName;
    var association = {
      name           : Model.table,
      model          : Model,
      reversed       : false,
      extension      : false,
      autoFetch      : false,
      autoFetchLimit : 2,
      required       : false
    };

    for (var i = 0; i < arguments.length; i++) {
      switch (typeof arguments[i]) {
        case "string":
          association.name = arguments[i];
          break;
        case "function":
          if (arguments[i].table) {
            association.model = arguments[i];
          }
          break;
        case "object":
          association = _.extend(association, arguments[i]);
          break;
      }
    }

    assocName = ucfirst(association.name);
    assocTemplateName = association.accessor || assocName;

    if (!association.hasOwnProperty("field")) {
      association.field = util.formatField(association.model, association.name, association.required, association.reversed);
    } else if(!association.extension) {
      association.field = util.wrapFieldObject({
        field: association.field, model: Model, altName: Model.table,
        mapsTo: association.mapsTo
      });
    }

    util.convertPropToJoinKeyProp(association.field, {
      makeKey: false, required: association.required
    });

    for (var k in Accessors) {
      if (!association.hasOwnProperty(k + "Accessor")) {
        association[k + "Accessor"] = Accessors[k] + assocTemplateName;
      }
    }

    associations.push(association);
    for (k in association.field) {
      if (!association.field.hasOwnProperty(k)) {
        continue;
      }
      if (!association.reversed) {
        Model.addProperty(
          _.extend({}, association.field[k], { klass: 'hasOne' }),
          false
        );
      }
    }

    if (association.reverse) {
      association.model.hasOne(association.reverse, Model, {
        reversed       : true,
        accessor       : association.reverseAccessor,
        reverseAccessor: undefined,
        field          : association.field,
        autoFetch      : association.autoFetch,
        autoFetchLimit : association.autoFetchLimit
      });
    }

    Model["findBy" + assocTemplateName] = function () {
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
        from  : { table: association.model.table, field: (association.reversed ? Object.keys(association.field) : association.model.id) },
        to    : { table: Model.table, field: (association.reversed ? association.model.id : Object.keys(association.field) ) },
        where : [ association.model.table, conditions ],
        table : Model.table
      };
      options.extra = [];

      if (typeof cb === "function") {
        return Model.find({}, options, cb);
      }
      return Model.find({}, options);
    };

    return this;
  };
};

exports.extend = function (Model, Instance, Driver, associations) {
  for (var i = 0; i < associations.length; i++) {
    extendInstance(Model, Instance, Driver, associations[i]);
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

function extendInstance(Model, Instance, Driver, association) {
  var promiseFunctionPostfix = Model.settings.get('promiseFunctionPostfix');
  Object.defineProperty(Instance, association.hasAccessor, {
    value: function (opts, cb) {
      if (typeof opts === "function") {
        cb = opts;
        opts = {};
      }

      if (util.hasValues(Instance, Object.keys(association.field))) {
        association.model.get(util.values(Instance, Object.keys(association.field)), opts, function (err, instance) {
          return cb(err, instance ? true : false);
        });
      } else {
        cb(null, false);
      }

      return this;
    },
    enumerable: false,
    writable: true
  });
  Object.defineProperty(Instance, association.getAccessor, {
    value: function (opts, cb) {
      if (typeof opts === "function") {
        cb = opts;
        opts = {};
      }

      var saveAndReturn = function (err, Assoc) {
        if (!err) {
          Instance[association.name] = Assoc;
        }

        return cb(err, Assoc);
      };

      if (association.reversed) {
        if (util.hasValues(Instance, Model.id)) {
          if (typeof cb !== "function") {
            return association.model.find(util.getConditions(Model, Object.keys(association.field), Instance), opts);
          }
          association.model.find(util.getConditions(Model, Object.keys(association.field), Instance), opts, saveAndReturn);
        } else {
          cb(null);
        }
      } else {
        if (Instance.isShell()) {
          Model.get(util.values(Instance, Model.id), function (err, instance) {
            if (err || !util.hasValues(instance, Object.keys(association.field))) {
              return cb(null);
            }
            association.model.get(util.values(instance, Object.keys(association.field)), opts, saveAndReturn);
          });
        } else if (util.hasValues(Instance, Object.keys(association.field))) {
          association.model.get(util.values(Instance, Object.keys(association.field)), opts, saveAndReturn);
        } else {
          cb(null);
        }
      }

      return this;
    },
    enumerable: false,
    writable: true
  });
  Object.defineProperty(Instance, association.setAccessor, {
    value: function (OtherInstance, next) {
      if (association.reversed) {
        Instance.save(function (err) {
          if (err) {
            return next(err);
          }

          if (!Array.isArray(OtherInstance)) {
            util.populateConditions(Model, Object.keys(association.field), Instance, OtherInstance, true);

            return OtherInstance.save({}, { saveAssociations: false }, next);
          }

          var saveAssociation = function (otherInstance, cb) {
            util.populateConditions(Model, Object.keys(association.field), Instance, otherInstance, true);

            otherInstance.save({}, { saveAssociations: false }, cb);
          };

          var associations = _.clone(OtherInstance);
          async.eachSeries(associations, saveAssociation, next);
        });
      } else {
        OtherInstance.save({}, { saveAssociations: false }, function (err) {
          if (err) {
            return next(err);
          }

          Instance[association.name] = OtherInstance;

          util.populateConditions(association.model, Object.keys(association.field), OtherInstance, Instance);

          return Instance.save({}, { saveAssociations: false }, next);
        });
      }

      return this;
    },
    enumerable: false,
    writable: true
  });

  if (!association.reversed) {
    Object.defineProperty(Instance, association.delAccessor, {
      value: function (cb) {
        for (var k in association.field) {
          if (association.field.hasOwnProperty(k)) {
            Instance[k] = null;
          }
        }
        Instance.save({}, { saveAssociations: false }, function (err) {
          if (!err) {
            delete Instance[association.name];
          }

          return cb();
        });

        return this;
      },
      enumerable: false,
      writable: true
    });
  }

  for (var i = 0; i < ACCESSOR_METHODS.length; i++) {
    var name = ACCESSOR_METHODS[i];
    var asyncNameAccessorName = association[name] + promiseFunctionPostfix;

    if (name === "delAccessor" && !Instance[association.delAccessor]) continue;
    Object.defineProperty(Instance, asyncNameAccessorName, {
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

  if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit === "undefined") {
    opts.autoFetchLimit = association.autoFetchLimit;
  }

  if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
    return cb();
  }

  // When we have a new non persisted instance for which the association field (eg owner_id)
  // is set, we don't want to auto fetch anything, since `new Model(owner_id: 12)` takes no
  // callback, and hence this lookup would complete at an arbitrary point in the future.
  // The associated entity should probably be fetched when the instance is persisted.
  if (Instance.isPersisted()) {
    Instance[association.getAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 }, cb);
  } else {
    return cb();
  }
}

function ucfirst(text) {
  return text[0].toUpperCase() + text.substr(1);
}
