var DriverAliases = require("./Drivers/aliases");
var Validators    = require("./Validators");
var Property      = require("./Property");

exports.validators = Validators;

exports.use = function (connection, proto, opts, cb) {
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}
	if (typeof opts == "function") {
		cb = opts;
		opts = {};
	}
	var Driver = require("./Drivers/" + proto).Driver;
	var driver = new Driver(null, connection, {
		debug: (opts.query && opts.query.debug == 'true')
	});

	var ORM = prepare(driver);

	return cb(null, ORM);
};

exports.connect = function (opts, cb) {
	var url = require("url");
	var orig = opts;
	if (typeof opts == "string") {
		opts = url.parse(opts, true);
	}
	if (opts.auth) {
		opts.user = opts.auth.split(":")[0];
		opts.password = opts.auth.split(":")[1];
	}
	opts.database = (opts.pathname ? opts.pathname.substr(1) : '');

	var proto  = opts.protocol.substr(0, opts.protocol.length - 1);
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}

	var Driver = require("./Drivers/" + proto).Driver;
	var driver = new Driver(orig, null, {
		debug: (opts.query && opts.query.debug == 'true')
	});

	driver.connect(function (err) {
		if (err) {
			return cb(err);
		}

		var ORM = prepare(driver);

		return cb(null, ORM);
	});
};

function prepare(driver) {
	var Model = require("./Model").Model;

	return {
		define: function (name, properties, opts) {
			properties = properties || {};
			opts       = opts || {};

			for (var k in properties) {
				properties[k] = Property.check(properties[k]);
			}

			this.models[name] = new Model({
				driver      : driver,
				table       : name,
				properties  : properties,
				cache       : opts.cache,
				autoSave    : opts.autoSave || false,
				autoFetch   : opts.autoFetch || false,
				hooks       : opts.hooks || {},
				methods     : opts.methods || {},
				validations : opts.validations || {}
			});
			return this.models[name];
		},
		close: function (cb) {
			driver.close(cb);

			return this;
		},
		models: {},
		validators: Validators,
		driver: driver
	};
}
