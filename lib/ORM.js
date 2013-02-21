var util          = require("util");
var events        = require("events");
var path          = require("path");

var Model         = require("./Model").Model;
var DriverAliases = require("./Drivers/aliases");
var Validators    = require("./Validators");
var Property      = require("./Property");
var SqlTools      = require("./sql/Tools");
var Settings      = require("./Settings");

exports.validators = Validators;
exports.settings   = new Settings.Container(Settings.defaults());

for (var tool in SqlTools) {
	exports[tool] = SqlTools[tool];
}

exports.use = function (connection, proto, opts, cb) {
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}
	if (typeof opts == "function") {
		cb = opts;
		opts = {};
	}

	try {
		var Driver = require("./Drivers/DML/" + proto).Driver;
		var driver = new Driver(null, connection, {
			debug: (opts.query && opts.query.debug == 'true')
		});

		return cb(null, new ORM(driver, new Settings.Container(exports.settings.get('*'))));
	} catch (ex) {
		return cb(ex);
	}
};

exports.connect = function (opts, cb) {
	var url = require("url");

	if (typeof opts == "string") {
		opts = url.parse(opts, true);
	}
	if (opts.auth) {
		opts.user = opts.auth.split(":")[0];
		opts.password = opts.auth.split(":")[1];
	}
	if (!opts.database) {
		opts.database = (opts.pathname ? opts.pathname.substr(1) : '');
	}

	var proto  = opts.protocol.replace(/:$/, '');
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}

	try {
		var Driver = require("./Drivers/DML/" + proto).Driver;
		var debug  = Boolean(extractOption(opts, "debug"));
		var pool   = Boolean(extractOption(opts, "pool"));
		var driver = new Driver(opts, null, {
			debug : debug,
			pool  : pool
		});

		driver.connect(function (err) {
			if (err) {
				return cb(err);
			}

			return cb(null, new ORM(driver, new Settings.Container(exports.settings.get('*'))));
		});
	} catch (ex) {
		return cb(ex);
	}
};

function ORM(driver, settings) {
	this.tools      = SqlTools;
	this.validators = Validators;
	this.settings   = settings;
	this.driver     = driver;
	this.models     = {};

	events.EventEmitter.call(this);

	driver.on("error", function (err) {
		this.emit("error", err);
	}.bind(this));
}

util.inherits(ORM, events.EventEmitter);

ORM.prototype.define = function (name, properties, opts) {
	properties = properties || {};
	opts       = opts || {};

	for (var k in properties) {
		properties[k] = Property.check(properties[k]);
	}

	this.models[name] = new Model({
		settings       : this.settings,
		driver         : this.driver,
		table          : opts.table || opts.collection || name,
		properties     : properties,
		cache          : opts.hasOwnProperty("cache") ? opts.cache : this.settings.get("instance.cache"),
		id             : opts.id || this.settings.get("properties.primary_key"),
		autoSave       : opts.autoSave || false,
		autoFetch      : opts.autoFetch || false,
		autoFetchLimit : opts.autoFetchLimit,
		hooks          : opts.hooks || {},
		methods        : opts.methods || {},
		validations    : opts.validations || {}
	});
	return this.models[name];
};
ORM.prototype.close = function (cb) {
	this.driver.close(cb);

	return this;
};
ORM.prototype.load = function (file, cb) {
	try {
		require((file[0] != path.sep ? process.cwd() + "/" : "") + file)(this, cb);
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

	syncNext();

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

function extractOption(opts, key) {
	if (!opts.query.hasOwnProperty(key)) {
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
