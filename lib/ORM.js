var url = require("url");

exports.connect = function (opts, cb) {
	if (typeof opts == "string") {
		opts = url.parse(opts, true);
	}
	if (opts.auth) {
		opts.user = opts.auth.split(":")[0];
		opts.password = opts.auth.split(":")[1];
	}
	opts.database = opts.path.substr(1);

	var proto  = opts.protocol.substr(0, opts.protocol.length - 1);
	var Driver = require("./Drivers/" + proto).Driver;
	var driver = new Driver(opts);

	driver.connect(function (err) {
		if (err) {
			return cb(err);
		}

		var Model = require("./Model").Model;
		var ORM = {
			define: function (name, properties, opts) {
				properties = properties || {};
				opts       = opts || {};

				this.models[name] = new Model({
					driver    : driver,
					table     : name,
					autoSave  : opts.autoSave || false,
					autoFetch : opts.autoFetch || false
				});
				return this.models[name];
			},
			close: function (cb) {
				driver.close(cb);

				return this;
			},
			models: {},
			driver: driver
		};

		return cb(null, ORM);
	});
};
