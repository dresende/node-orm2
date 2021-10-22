var Utilities = require("../../Utilities");
var mongodb   = require("mongodb");
var Promise   = require("bluebird");
var util      = require("util");
var _         = require('lodash');

exports.Driver = Driver;

function Driver(config, connection, opts) {
  this.client = new mongodb.MongoClient();
  this.db     = null;
  this.config = config || {};
  this.opts   = opts;

  if (!this.config.timezone) {
    this.config.timezone = "local";
  }

  this.opts.settings.set("properties.primary_key", "_id");
  this.opts.settings.set("properties.association_key", function (name, field) {
    return name + "_" + field.replace(/^_+/, '');
  });
}

Driver.prototype.sync = function (opts, cb) {
  this.db.createCollection(opts.table, function (err, collection) {
    if (err) {
      return cb(err);
    }

    var indexes = [], pending;

    for (var i = 0; i < opts.one_associations.length; i++) {
      if (opts.one_associations[i].extension) continue;
      if (opts.one_associations[i].reversed) continue;

      for (var k in opts.one_associations[i].field) {
        indexes.push(k);
      }
    }

    for (i = 0; i < opts.many_associations.length; i++) {
      if (opts.many_associations[i].reversed) continue;

      indexes.push(opts.many_associations[i].name);
    }

    pending = indexes.length;

    for (i = 0; i < indexes.length; i++) {
      collection.createIndex(indexes[i], function () {
        if (--pending === 0) {
          return cb();
        }
      });
    }

    if (pending === 0) {
      return cb();
    }
  });
};

Driver.prototype.drop = function (opts, cb) {
  return this.db.collection(opts.table).drop(function () {
    if (typeof cb == "function") {
      return cb();
    }
  });
};

Driver.prototype.ping = function (cb) {
  return process.nextTick(cb);
};

Driver.prototype.on = function (ev, cb) {
  // if (ev == "error") {
  //   this.db.on("error", cb);
  //   this.db.on("unhandledError", cb);
  // }
  return this;
};

Driver.prototype.connect = function (cb) {
  this.client.connect(this.config.href, function (err, db) {
    if (err) {
      return cb(err);
    }

    this.db = db;

    return cb();
  }.bind(this));
};

Driver.prototype.close = function (cb) {
  if (this.db) {
    this.db.close();
  }
  if (typeof cb == "function") {
    cb();
  }
  return;
};

Driver.prototype.find = function (fields, table, conditions, opts, cb) {
  var collection = this.db.collection(table);

  convertToDB(conditions, this.config.timezone);

  var cursor = (fields ? collection.find(conditions, fields) : collection.find(conditions));

  if (opts.order) {
    var orders = [];

    for (var i = 0; i < opts.order.length; i++) {
      orders.push([ opts.order[i][0], (opts.order[i][1] == 'Z' ? 'desc' : 'asc') ]);
    }
    cursor.sort(orders);
  }
  if (opts.offset) {
    cursor.skip(opts.offset);
  }
  if (opts.limit) {
    cursor.limit(opts.limit);
  }

  return cursor.toArray(function (err, docs) {
    if (err) {
      throw err;
      return cb(err);
    }

    var pending = 0;

    for (var i = 0; i < docs.length; i++) {
      convertFromDB(docs[i], this.config.timezone);
      if (opts.extra && opts.extra[docs[i]._id]) {
        docs[i] = _.merge(docs[i], _.omit(opts.extra[docs[i]._id], '_id'));
      }
      if (opts.createInstance) {
        pending += 1;

        docs[i] = opts.createInstance(docs[i], {
          extra : opts.extra_props
        }, function () {
          if (--pending === 0) {
            return cb(null, docs);
          }
        });
      }
    }

    if (pending === 0) {
      return cb(null, docs);
    }
  }.bind(this));
};

Driver.prototype.count = function (table, conditions, opts, cb) {
  var collection = this.db.collection(table);

  convertToDB(conditions, this.config.timezone);

  var cursor     = collection.find(conditions);

  if (opts.order) {
    var orders = [];

    for (var i = 0; i < opts.order.length; i++) {
      orders.push([ opts.order[i][0], (opts.order[i][1] == 'Z' ? 'desc' : 'asc') ]);
    }
    cursor.sort(orders);
  }
  if (opts.offset) {
    cursor.skip(opts.offset);
  }
  if (opts.limit) {
    cursor.limit(opts.limit);
  }

  return cursor.count(true, function (err, count) {
    if (err) return cb(err);

    return cb(null, [{ c : count }]);
  });
};

Driver.prototype.insert = function (table, data, keyProperties, cb) {
  convertToDB(data, this.config.timezone);

  return this.db.collection(table).insert(
    data,
    {
      w : 1
    },
    function (err, docs) {
      if (err) return cb(err);

      var i, ids = {}, prop;

      if (keyProperties && docs.length) {
        for (i = 0; i < keyProperties.length; i++) {
          prop = keyProperties[i];

          if (prop.mapsTo in docs[0]) {
            ids[prop.name] = docs[0][prop.mapsTo];
          }
        }
        convertFromDB(ids, this.config.timezone);
      }

      return cb(null, ids);
    }.bind(this)
  );
};

Driver.prototype.hasMany = function (Model, association) {
  var db = this.db.collection(Model.table);
  var driver = this;

  return {
    has: function (Instance, Associations, conditions, cb) {
      return db.find({
        _id : new mongodb.ObjectID(Instance[Model.id])
      }, [ association.name ]).toArray(function (err, docs) {
        if (err) return cb(err);
        if (!docs.length) return cb(new Error("Not found"));
        if (!Array.isArray(docs[0][association.name])) return cb(null, false);
        if (!docs[0][association.name].length) return cb(null, false);

        var found;

        for (var i = 0; i < Associations.length; i++) {
          found = false;
          for (var j = 0; j < docs[0][association.name].length; j++) {
            if (docs[0][association.name][j]._id == Associations[i][association.model.id]) {
              found = true;
              break;
            }
          }
          if (!found) {
            return cb(null, false);
          }
        }

        return cb(null, true);
      });
    },
    get: function (Instance, conditions, options, createInstance, cb) {
      return db.find({
        _id : new mongodb.ObjectID(Instance[Model.id])
      }, [ association.name ]).toArray(function (err, docs) {
        if (err) return cb(err);
        if (!docs.length) return cb(new Error("Not found"));

        if (!docs[0][association.name]) {
          return cb(null, []);
        }

        var extra = {}
        conditions._id = { $in: [] };

        for (var i = 0; i < docs[0][association.name].length; i++) {
          conditions._id.$in.push(new mongodb.ObjectID(docs[0][association.name][i]._id));
          extra[docs[0][association.name][i]._id] = docs[0][association.name][i];
        }

        if (options.order) {
          options.order[0] = options.order[0][1];
        }

        return association.model.find(conditions, options, function (e,docs) {
          var i, len;
          for (i = 0, len = docs.length; i < len; i++) {
            if (extra.hasOwnProperty(docs[i][association.model.id])) {
              docs[i].extra = extra[docs[i][association.model.id]];
            }
          }
          cb(e, docs);
        });
      });
    },
    add: function (Instance, Association, data, cb) {
      var push = {};
      push[association.name] = { _id : Association[association.model.id] };

      for (var k in data) {
        push[association.name][k] = data[k];
      }

      return db.update({
        _id    : new mongodb.ObjectID(Instance[Model.id])
      }, {
        $push  : push
      }, {
        safe   : true,
        upsert : true
      }, cb);
    },
    del: function (Instance, Associations, cb) {
      if (Associations.length === 0) {
        var unset = {};
        unset[association.name] = 1;

        return db.update({
          _id    : new mongodb.ObjectID(Instance[Model.id])
        }, {
          $unset : unset
        }, {
          safe   : true,
          upsert : true
        }, cb);
      }

      var pull = {};
      pull[association.name] = [];

      for (var i = 0; i < Associations.length; i++) {
        var props = {_id: Associations[i][association.model.id]};

        if (Associations[i].extra !== undefined) {
          props = _.merge(props, _.pick(Associations[i].extra, _.keys(association.props)));
        }

        pull[association.name].push(props);
      }

      return db.update({
        _id      : new mongodb.ObjectID(Instance[Model.id])
      }, {
        $pullAll : pull
      }, {
        safe     : true,
        upsert   : true
      }, cb);
    }
  };
};

Driver.prototype.update = function (table, changes, conditions, cb) {
  convertToDB(changes, this.config.timezone);
  convertToDB(conditions, this.config.timezone);

  return this.db.collection(table).update(
    conditions,
    {
      $set   : changes
    },
    {
      safe   : true,
      upsert : true
    },
    cb
  );
};

Driver.prototype.remove = function (table, conditions, cb) {
  convertToDB(conditions, this.config.timezone);

  return this.db.collection(table).remove(conditions, cb);
};

Driver.prototype.clear = function (table, cb) {
  return this.db.collection(table).remove(cb);
};

function convertToDB(obj, timeZone) {
  for (var k in obj) {
    if ([ 'and', 'or', 'not' ].indexOf(k) >= 0) {
      for (var j = 0; j < obj[k].length; j++) {
        convertToDB(obj[k][j], timeZone);
      }
      obj['$' + k] = obj[k];
      delete obj[k];
      continue;
    }
    if (Array.isArray(obj[k]) && k[0] != '$') {
      for (var i = 0; i < obj[k].length; i++) {
        obj[k][i] = convertToDBVal(k, obj[k][i], timeZone);
      }

      obj[k] = { $in: obj[k] };
      continue;
    }

    obj[k] = convertToDBVal(k, obj[k], timeZone);
  }
}

function convertFromDB(obj, timezone) {
  for (var k in obj) {
    if (obj[k] instanceof mongodb.ObjectID) {
      obj[k] = obj[k].toString();
      continue;
    }
    if (obj[k] instanceof mongodb.Binary) {
      obj[k] = new Buffer(obj[k].value(), "binary");
      continue;
    }
  }
}

function convertToDBVal(key, value, timezone) {
  if (value && typeof value.sql_comparator == "function") {
    var val       = (key != "_id" ? value.val : new mongodb.ObjectID(value.val));
    var comp      = value.sql_comparator();
    var condition = {};

    switch (comp) {
      case "gt":
      case "gte":
      case "lt":
      case "lte":
      case "ne":
        condition["$" + comp] = val;
        break;
      case "eq":
        condition = val;
        break;
      case "between":
        condition["$min"] = value.from;
        condition["$max"] = value.to;
        break;
      case "like":
        condition["$regex"] = value.expr.replace("%", ".*");
        break;
    }

    return condition;
  }

  if (Buffer.isBuffer(value)) {
    return new mongodb.Binary(value);
  }

  if (key == "_id" && typeof value == "string") {
    value = new mongodb.ObjectID(value);
  }

  return value;
}

['ping', 'find', 'count', 'insert', 'update', 'remove', 'clear',].forEach(function (fnName) {
  Driver.prototype[fnName + 'Async'] = Promise.promisify(Driver.prototype[fnName]);
});

Object.defineProperty(Driver.prototype, "isSql", {
    value: false
});
