var util          = require("util");
var events        = require("events");

var Model         = require("./Model").Model;
var DriverAliases = require("./Drivers/aliases");
var Validators    = require("./Validators");
var Property      = require("./Property");
var SqlTools      = require("./sql/Tools");

exports.validators = Validators;

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

		return cb(null, new ORM(driver));
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
		var driver = new Driver(opts, null, {
			debug: (opts.query && opts.query.debug == 'true')
		});

		driver.connect(function (err) {
			if (err) {
				return cb(err);
			}

			return cb(null, new ORM(driver));
		});
	} catch (ex) {
		return cb(ex);
	}
};

function ORM(driver) {
	this.models = {};
	this.driver = driver;
	this.validators = Validators;
	this.tools = SqlTools;

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
		driver         : this.driver,
		table          : opts.table || opts.collection || name,
		properties     : properties,
		cache          : opts.cache,
		id             : opts.id || "id",
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
		require(file)(this, cb);
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
