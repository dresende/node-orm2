var util           = require("util");
var events         = require("events");
var path           = require("path");
var url            = require("url");
var hat            = require("hat");
var Query          = require("sql-query");
var enforce        = require("enforce");

var Model          = require("./Model").Model;
var DriverAliases  = require("./Drivers/aliases");
var Settings       = require("./Settings");
var Singleton      = require("./Singleton");
var ErrorCodes     = require("./ErrorCodes");
var Utilities      = require("./Utilities");

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
exports.ErrorCodes = ErrorCodes;

exports.Text = Query.Text;
for (var k in Query.Comparators) {
	exports[Query.Comparators[k]] = Query[Query.Comparators[k]];
}

exports.express = function () {
	return require("./Express").apply(this, arguments);
};

exports.use = function (connection, proto, opts, cb) {
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}
	if (typeof opts === "function") {
		cb = opts;
		opts = {};
	}

	try {
		var Driver   = require("./Drivers/DML/" + proto).Driver;
		var settings = new Settings.Container(exports.settings.get('*'));
		var driver   = new Driver(null, connection, {
			debug    : (opts.query && opts.query.debug === 'true'),
			settings : settings
		});

		return cb(null, new ORM(proto, driver, settings));
	} catch (ex) {
		return cb(ex);
	}
};

exports.connect = function (opts, cb) {
	if (arguments.length === 0 || !opts) {
		return ORM_Error(ErrorCodes.generateError(ErrorCodes.PARAM_MISMATCH, "CONNECTION_URL_EMPTY"), cb);
	}
	if (typeof opts === "string") {
		if (opts.replace(/\s+/, "").length === 0) {
			return ORM_Error(ErrorCodes.generateError(ErrorCodes.PARAM_MISMATCH, "CONNECTION_URL_EMPTY"), cb);
		}
		opts = url.parse(opts, true);
	}
	if (!opts.database) {
		// if (!opts.pathname) {
		// 	return cb(new Error("CONNECTION_URL_NO_DATABASE"));
		// }
		opts.database = (opts.pathname ? opts.pathname.substr(1) : "");
	}
	if (!opts.protocol) {
		return ORM_Error(ErrorCodes.generateError(ErrorCodes.PARAM_MISMATCH, "CONNECTION_URL_NO_PROTOCOL"), cb);
	}
	// if (!opts.host) {
	// 	opts.host = opts.hostname = "localhost";
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

	var proto  = opts.protocol.replace(/:$/, '');
	var db;
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}

	try {
		var Driver   = require("./Drivers/DML/" + proto).Driver;
		var settings = new Settings.Container(exports.settings.get('*'));
		var debug    = extractOption(opts, "debug");
		var pool     = extractOption(opts, "pool");
		var driver   = new Driver(opts, null, {
			debug    : (debug !== null ? Boolean(debug) : settings.get("connection.debug")),
			pool     : (pool !== null ? Boolean(pool) : settings.get("connection.pool")),
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
		if (ex.code === "MODULE_NOT_FOUND" || ex.message.indexOf('find module')) {
			return ORM_Error(ErrorCodes.generateError(ErrorCodes.NO_SUPPORT, "CONNECTION_PROTOCOL_NOT_SUPPORTED"), cb);
		}
		return ORM_Error(ex, cb);
	}

	return db;
};

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
				return this.emit("error", ErrorCodes.generateError(ErrorCodes.CONNECTION_LOST, "Connection lost - driver does not support reconnection"));
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
		cache          : opts.hasOwnProperty("cache") ? opts.cache : this.settings.get("instance.cache"),
		id             : opts.id || this.settings.get("properties.primary_key"),
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
}
ORM.prototype.ping = function (cb) {
	this.driver.ping(cb);

	return this;
};
ORM.prototype.close = function (cb) {
	this.driver.close(cb);

	return this;
};
ORM.prototype.load = function (file, cb) {
	try {
		return require(Utilities.getRealPath(file))(this, cb);
	} catch (ex) {
		return cb(ex);
	}
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

function extractOption(opts, key) {
	if (!opts.query || !opts.query.hasOwnProperty(key)) {
		return null;
	}

	var opt = opts.query[key];

	delete opts.query[key];
	if (opts.href) {
		opts.href = opts.href.replace(new RegExp(key + "=[^&]+&?"), "");
	}
	if (opts.search) {
		opts.search = opts.search.replace(new RegExp(key + "=[^&]+&?"), "");
	}
	return opt;
}
