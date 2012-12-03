var DriverAliases = require("./Drivers/aliases");
var Validators    = require("./Validators");
var Property      = require("./Property");

exports.validators = Validators;

exports.use = function (connection, proto, cb) {
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}
	var Driver = require("./Drivers/" + proto).Driver;
	var driver = new Driver(null, connection);

	var ORM = prepare(driver);

	return cb(null, ORM);
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
	opts.database = (opts.path ? opts.path.substr(1) : '');

	var proto  = opts.protocol.substr(0, opts.protocol.length - 1);
	if (DriverAliases[proto]) {
		proto = DriverAliases[proto];
	}

	var Driver = require("./Drivers/" + proto).Driver;
	var driver = new Driver(opts);

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
