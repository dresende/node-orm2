var _              = require("lodash");
var async          = require("async");
var Promise        = require('bluebird');
var enforce        = require("enforce");
var events         = require("events");
var hat            = require("hat");
var Query          = require("sql-query");
var url            = require("url");
var util           = require("util");

var adapters       = require("./Adapters");
var DriverAliases  = require("./Drivers/aliases");
var ORMError       = require("./Error");
var Model          = require("./Model").Model;
var Settings       = require("./Settings");
var Singleton      = require("./Singleton");
var Utilities      = require("./Utilities");

var OPTS_TYPE_STRING = 'string';
var OPTS_TYPE_OBJ = 'object';

// Deprecated, use enforce
exports.validators = require("./Validators");

// specific to ORM, not in enforce for now
enforce.equalToProperty = exports.validators.equalToProperty;
enforce.unique          = exports.validators.unique;

exports.enforce    = enforce;

exports.singleton  = Singleton;
exports.settings   = new Settings.Container(Settings.defaults());

exports.Property   = require("./Property");
exports.Settings   = Settings;
exports.ErrorCodes = ORMError.codes;

var optsChecker = function (opts) {
  return [OPTS_TYPE_STRING, OPTS_TYPE_OBJ].some(function (element) { return typeof(opts) === element })
};

var fileLoader = function (filePaths, cb) {
  var self = this;
  var iterator = function (filePath, cb) {
    try {
      require(filePath)(self, cb);
    } catch (err) {
      return cb(err)
    }
  };

  async.eachSeries(filePaths, iterator, cb);
};

var connect = function (opts, cb) {
  if (arguments.length === 0 || !opts || !optsChecker(opts)) {
    cb = typeof(cb) !== 'function' ? opts : cb;
    return ORM_Error(new ORMError("CONNECTION_URL_EMPTY", 'PARAM_MISMATCH'), cb);
  }
  if (typeof opts === 'string') {
    if (opts.trim().length === 0) {
      return ORM_Error(new ORMError("CONNECTION_URL_EMPTY", 'PARAM_MISMATCH'), cb);
    }
    opts = url.parse(opts, true);
  } else if (typeof opts === 'object') {
    opts = _.cloneDeep(opts);
  }

  opts.query = opts.query || {};
  for(var k in opts.query) {
    opts.query[k] = queryParamCast(opts.query[k]);
    opts[k] = opts.query[k];
  }

  if (!opts.database) {
    // if (!opts.pathname) {
    //   return cb(new Error("CONNECTION_URL_NO_DATABASE"));
    // }
    opts.database = (opts.pathname ? opts.pathname.substr(1) : "");
  }
  if (!opts.protocol) {
    return ORM_Error(new ORMError("CONNECTION_URL_NO_PROTOCOL", 'PARAM_MISMATCH'), cb);
  }
  // if (!opts.host) {
  //   opts.host = opts.hostname = "localhost";
  // }
  if (opts.auth) {
    opts.user = opts.auth.split(":")[0];
    opts.password = opts.auth.split(":")[1];
  }
  if (!opts.hasOwnProperty("user")) {
    opts.user = "root";
  }
  if (!opts.hasOwnProperty("password")) {
    opts.password = "";
  }
  if (opts.hasOwnProperty("hostname")) {
    opts.host = opts.hostname;
  }

  var proto  = opts.protocol.replace(/:$/, '');
  var db;
  if (DriverAliases[proto]) {
    proto = DriverAliases[proto];
  }

  try {
    var Driver   = adapters.get(proto);
    var settings = new Settings.Container(exports.settings.get('*'));
    var driver   = new Driver(opts, null, {
      debug    : 'debug' in opts.query ? opts.query.debug : settings.get("connection.debug"),
      pool     : 'pool'  in opts.query ? opts.query.pool  : settings.get("connection.pool"),
      settings : settings
    });

    db = new ORM(proto, driver, settings);

    driver.connect(function (err) {
      if (typeof cb === "function") {
        if (err) {
          return cb(err);
        } else {
          return cb(null, db);
        }
      }

      db.emit("connect", err, !err ? db : null);
    });
  } catch (ex) {
    if (ex.code === "MODULE_NOT_FOUND" || ex.message.indexOf('find module') > -1) {
      return ORM_Error(new ORMError("Connection protocol not supported - have you installed the database driver for " + proto + "?", 'NO_SUPPORT'), cb);
    }
    return ORM_Error(ex, cb);
  }

  return db;
};

var use = function (connection, proto, opts, cb) {
  if (DriverAliases[proto]) {
    proto = DriverAliases[proto];
  }
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }

  try {
    var Driver   = adapters.get(proto);
    var settings = new Settings.Container(exports.settings.get('*'));
    var driver   = new Driver(null, connection, {
      debug    : (opts.query && opts.query.debug === 'true'),
      settings : settings
    });

    return cb(null, new ORM(proto, driver, settings));
  } catch (ex) {
    return cb(ex);
  }
}

exports.Text = Query.Text;
for (var k in Query.Comparators) {
  exports[Query.Comparators[k]] = Query[Query.Comparators[k]];
}

exports.express = function () {
  return require("./Express").apply(this, arguments);
};

exports.use = use;
exports.useAsync = Promise.promisify(use);

/**
 *
 * @param opts
 */
exports.connectAsync = Promise.promisify(connect);

exports.addAdapter = adapters.add;

function ORM(driver_name, driver, settings) {
  this.validators  = exports.validators;
  this.enforce     = exports.enforce;
  this.settings    = settings;
  this.driver_name = driver_name;
  this.driver      = driver;
  this.driver.uid  = hat();
  this.tools       = {};
  this.models      = {};
  this.plugins     = [];
  this.customTypes = {};

  for (var k in Query.Comparators) {
    this.tools[Query.Comparators[k]] = Query[Query.Comparators[k]];
  }

  events.EventEmitter.call(this);

  var onError = function (err) {
    if (this.settings.get("connection.reconnect")) {
      if (typeof this.driver.reconnect === "undefined") {
        return this.emit("error", new ORMError("Connection lost - driver does not support reconnection", 'CONNECTION_LOST'));
      }
      this.driver.reconnect(function () {
        this.driver.on("error", onError);
      }.bind(this));

      if (this.listeners("error").length === 0) {
        // since user want auto reconnect,
        // don't emit without listeners or it will throw
        return;
      }
    }
    this.emit("error", err);
  }.bind(this);

  driver.on("error", onError);
}

util.inherits(ORM, events.EventEmitter);

ORM.prototype.use = function (plugin_const, opts) {
  if (typeof plugin_const === "string") {
    try {
      plugin_const = require(Utilities.getRealPath(plugin_const));
    } catch (e) {
      throw e;
    }
  }

  var plugin = new plugin_const(this, opts || {});

  if (typeof plugin.define === "function") {
    for (var k in this.models) {
      plugin.define(this.models[k]);
    }
  }

  this.plugins.push(plugin);

  return this;
};
ORM.prototype.define = function (name, properties, opts) {
  var i;

  properties = properties || {};
  opts       = opts || {};

  for (i = 0; i < this.plugins.length; i++) {
    if (typeof this.plugins[i].beforeDefine === "function") {
      this.plugins[i].beforeDefine(name, properties, opts);
    }
  }

  this.models[name] = new Model({
    db             : this,
    settings       : this.settings,
    driver_name    : this.driver_name,
    driver         : this.driver,
    table          : opts.table || opts.collection || ((this.settings.get("model.namePrefix") || "") + name),
    properties     : properties,
    extension      : opts.extension || false,
    indexes        : opts.indexes || [],
    identityCache       : opts.hasOwnProperty("identityCache") ? opts.identityCache : this.settings.get("instance.identityCache"),
    keys           : opts.id,
    autoSave       : opts.hasOwnProperty("autoSave") ? opts.autoSave : this.settings.get("instance.autoSave"),
    autoFetch      : opts.hasOwnProperty("autoFetch") ? opts.autoFetch : this.settings.get("instance.autoFetch"),
    autoFetchLimit : opts.autoFetchLimit || this.settings.get("instance.autoFetchLimit"),
    cascadeRemove  : opts.hasOwnProperty("cascadeRemove") ? opts.cascadeRemove : this.settings.get("instance.cascadeRemove"),
    hooks          : opts.hooks || {},
    methods        : opts.methods || {},
    validations    : opts.validations || {}
  });

  for (i = 0; i < this.plugins.length; i++) {
    if (typeof this.plugins[i].define === "function") {
      this.plugins[i].define(this.models[name], this);
    }
  }

  return this.models[name];
};

ORM.prototype.defineType = function (name, opts) {
  this.customTypes[name] = opts;
  this.driver.customTypes[name] = opts;
  return this;
};

ORM.prototype.ping = function (cb) {
  this.driver.ping(cb);

  return this;
};

ORM.prototype.pingAsync = Promise.promisify(ORM.prototype.ping);

ORM.prototype.close = function (cb) {
  this.driver.close(cb);

  return this;
};

ORM.prototype.closeAsync = Promise.promisify(ORM.prototype.close);

ORM.prototype.load = function () {
  var files = _.flatten(Array.prototype.slice.apply(arguments));
  var cb    = function () {};

  if (typeof files[files.length - 1] == "function") {
    cb = files.pop();
  }

  var filesWithPath = [];

  // Due to intricacies of `Utilities.getRealPath` the following
  // code has to look as it does.
  for(var a = 0; a < files.length; a++) {
    filesWithPath.push(function () {
      return Utilities.getRealPath(files[a], 4)
    }());
  }

  fileLoader.call(this, filesWithPath, cb);
};

ORM.prototype.loadAsync = function () {
  var files = _.flatten(Array.prototype.slice.apply(arguments));
  var filesWithPath = [];
  // Due to intricacies of `Utilities.getRealPath` the following
  // code has to look as it does.

  for(var i = 0; i < files.length; i++) {
    var file = files[i];
    filesWithPath.push(function () {
      return Utilities.getRealPath(file, 4)
    }());
  }

  return Promise.promisify(fileLoader, { context: this })(filesWithPath)
};

ORM.prototype.sync = function (cb) {
  var modelIds = Object.keys(this.models);
  var syncNext = function () {
    if (modelIds.length === 0) {
      return cb();
    }

    var modelId = modelIds.shift();

    this.models[modelId].sync(function (err) {
      if (err) {
        err.model = modelId;

        return cb(err);
      }

      return syncNext();
    });
  }.bind(this);

  if (arguments.length === 0) {
    cb = function () {};
  }

  syncNext();

  return this;
};

ORM.prototype.syncPromise = Promise.promisify(ORM.prototype.sync);

ORM.prototype.drop = function (cb) {
  var modelIds = Object.keys(this.models);
  var dropNext = function () {
    if (modelIds.length === 0) {
      return cb();
    }

    var modelId = modelIds.shift();

    this.models[modelId].drop(function (err) {
      if (err) {
        err.model = modelId;

        return cb(err);
      }

      return dropNext();
    });
  }.bind(this);

  if (arguments.length === 0) {
    cb = function () {};
  }

  dropNext();

  return this;
};

ORM.prototype.dropAsync = Promise.promisify(ORM.prototype.drop);

ORM.prototype.serial = function () {
  var chains = Array.prototype.slice.apply(arguments);

  return {
    get: function (cb) {
      var params = [];
      var getNext = function () {
        if (params.length === chains.length) {
          params.unshift(null);
          return cb.apply(null, params);
        }

        chains[params.length].run(function (err, instances) {
          if (err) {
            params.unshift(err);
            return cb.apply(null, params);
          }

          params.push(instances);
          return getNext();
        });
      };

      getNext();

      return this;
    }
  };
};

function ORM_Error(err, cb) {
  var Emitter = new events.EventEmitter();

  Emitter.use = Emitter.define = Emitter.sync = Emitter.load = function () {};

  if (typeof cb === "function") {
    cb(err);
  }

  process.nextTick(function () {
    Emitter.emit("connect", err);
  });

  return Emitter;
}

function queryParamCast (val) {
  if (typeof val == 'string')  {
    switch (val) {
      case '1':
      case 'true':
        return true;
      case '0':
      case 'false':
        return false;
    }
  }
  return val;
}

exports.connect = connect;