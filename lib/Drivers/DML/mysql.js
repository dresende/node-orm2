var _       = require("lodash");
var mysql   = require("mysql");
var Query   = require("sql-query").Query;
var shared  = require("./_shared");
var DDL     = require("../DDL/SQL");

exports.Driver = Driver;

function Driver(config, connection, opts) {
  this.dialect = 'mysql';
  this.config = config || {};
  this.opts   = opts || {};
  this.customTypes = {};

  if (!this.config.timezone) {
    this.config.timezone = "local";
  }

  this.query  = new Query({ dialect: this.dialect, timezone: this.config.timezone });

  this.reconnect(null, connection);

  this.aggregate_functions = [ "ABS", "CEIL", "FLOOR", "ROUND",
                               "AVG", "MIN", "MAX",
                               "LOG", "LOG2", "LOG10", "EXP", "POWER",
                               "ACOS", "ASIN", "ATAN", "COS", "SIN", "TAN",
                               "CONV", [ "RANDOM", "RAND" ], "RADIANS", "DEGREES",
                               "SUM", "COUNT",
                               "DISTINCT"];
}

_.extend(Driver.prototype, shared, DDL);

Driver.prototype.ping = function (cb) {
  this.db.ping(cb);
  return this;
};

Driver.prototype.on = function (ev, cb) {
  if (ev == "error") {
    this.db.on("error", cb);
    this.db.on("unhandledError", cb);
  }
  return this;
};

Driver.prototype.connect = function (cb) {
  if (this.opts.pool) {
    return this.db.pool.getConnection(function (err, con) {
      if (!err) {
        if (con.release) {
          con.release();
        } else {
          con.end();
        }
      }
      return cb(err);
    });
  }
  this.db.connect(cb);
};

Driver.prototype.reconnect = function (cb, connection) {
  var connOpts = this.config.href || this.config;

  // Prevent noisy mysql driver output
  if (typeof connOpts == 'object') {
    connOpts = _.omit(connOpts, 'debug');
  }
  if (typeof connOpts == 'string') {
    connOpts = connOpts.replace("debug=true", "debug=false");
  }

  this.db = (connection ? connection : mysql.createConnection(connOpts));
  if (this.opts.pool) {
    this.db.pool = (connection ? connection : mysql.createPool(connOpts));
  }
  if (typeof cb == "function") {
    this.connect(cb);
  }
};

Driver.prototype.close = function (cb) {
  if (this.opts.pool) {
    this.db.pool.end(cb);
  } else {
    this.db.end(cb);
  }
};

Driver.prototype.getQuery = function () {
  return this.query;
};

Driver.prototype.execSimpleQuery = function (query, cb) {

  if (this.opts.debug) {
    require("../../Debug").sql('mysql', query);
  }
  if (this.opts.pool) {
    this.poolQuery(query, cb);
  } else {
    this.db.query(query, cb);
  }
};

Driver.prototype.find = function (fields, table, conditions, opts, cb) {
  var q = this.query.select()
                    .from(table).select(fields);

  if (opts.offset) {
    q.offset(opts.offset);
  }
  if (typeof opts.limit == "number") {
    q.limit(opts.limit);
  } else if (opts.offset) {
    // OFFSET cannot be used without LIMIT so we use the biggest BIGINT number possible
    q.limit('18446744073709551615');
  }
  if (opts.order) {
    for (var i = 0; i < opts.order.length; i++) {
      q.order(opts.order[i][0], opts.order[i][1]);
    }
  }

  if (opts.merge) {
    q.from(opts.merge.from.table, opts.merge.from.field, opts.merge.to.field).select(opts.merge.select);
    if (opts.merge.where && Object.keys(opts.merge.where[1]).length) {
      q = q.where(opts.merge.where[0], opts.merge.where[1], opts.merge.table || null, conditions);
    } else {
      q = q.where(opts.merge.table || null, conditions);
    }
  } else {
    q = q.where(conditions);
  }

  if (opts.exists) {
    for (var k in opts.exists) {
      q.whereExists(opts.exists[k].table, table, opts.exists[k].link, opts.exists[k].conditions);
    }
  }

  q = q.build();

  this.execSimpleQuery(q, cb);
};

Driver.prototype.count = function (table, conditions, opts, cb) {
  var q = this.query.select()
                    .from(table)
                    .count(null, 'c');

  if (opts.merge) {
    q.from(opts.merge.from.table, opts.merge.from.field, opts.merge.to.field);
    if (opts.merge.where && Object.keys(opts.merge.where[1]).length) {
      q = q.where(opts.merge.where[0], opts.merge.where[1], conditions);
    } else {
      q = q.where(conditions);
    }
  } else {
    q = q.where(conditions);
  }

  if (opts.exists) {
    for (var k in opts.exists) {
      q.whereExists(opts.exists[k].table, table, opts.exists[k].link, opts.exists[k].conditions);
    }
  }

  q = q.build();

  this.execSimpleQuery(q, cb);
};

Driver.prototype.insert = function (table, data, keyProperties, cb) {
  var q = this.query.insert()
                    .into(table)
                    .set(data)
                    .build();

  this.execSimpleQuery(q, function (err, info) {
    if (err) return cb(err);

    var i, ids = {}, prop;

    if (keyProperties) {
      if (keyProperties.length == 1 && info.hasOwnProperty("insertId") && info.insertId !== 0 ) {
        ids[keyProperties[0].name] = info.insertId;
      } else {
        for(i = 0; i < keyProperties.length; i++) {
          prop = keyProperties[i];
          ids[prop.name] = data[prop.mapsTo];
        }
      }
    }
    return cb(null, ids);
  });
};

Driver.prototype.update = function (table, changes, conditions, cb) {
  var q = this.query.update()
                    .into(table)
                    .set(changes)
                    .where(conditions)
                    .build();

  this.execSimpleQuery(q, cb);
};

Driver.prototype.remove = function (table, conditions, cb) {
  var q = this.query.remove()
                    .from(table)
                    .where(conditions)
                    .build();

  this.execSimpleQuery(q, cb);
};

Driver.prototype.clear = function (table, cb) {
  var q = "TRUNCATE TABLE " + this.query.escapeId(table);

  this.execSimpleQuery(q, cb);
};

Driver.prototype.poolQuery = function (query, cb) {
  this.db.pool.getConnection(function (err, con) {
    if (err) {
      return cb(err);
    }

    con.query(query, function (err, data) {
      if (con.release) {
        con.release();
      } else {
        con.end();
      }

      return cb(err, data);
    });
  });
};

Driver.prototype.valueToProperty = function (value, property) {
  var customType;

  switch (property.type) {
    case "boolean":
      value = !!value;
      break;
    case "object":
      if (typeof value == "object" && !Buffer.isBuffer(value)) {
        break;
      }
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = null;
      }
      break;
    default:
      customType = this.customTypes[property.type];
      if(customType && 'valueToProperty' in customType) {
        value = customType.valueToProperty(value);
      }
  }
  return value;
};

Driver.prototype.propertyToValue = function (value, property) {
  var customType;

  switch (property.type) {
    case "boolean":
      value = (value) ? 1 : 0;
      break;
    case "object":
      if (value !== null) {
        value = JSON.stringify(value);
      }
      break;
    case "point":
      return function() { return 'POINT(' + value.x + ', ' + value.y + ')'; };
      break;
    default:
      customType = this.customTypes[property.type];
      if(customType && 'propertyToValue' in customType) {
        value = customType.propertyToValue(value);
      }
  }
  return value;
};

Object.defineProperty(Driver.prototype, "isSql", {
    value: true
});
