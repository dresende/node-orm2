var util     = require("util");
var postgres = require("./postgres");

exports.Driver = Driver;

function Driver(config, connection, opts) {
	postgres.Driver.call(this, config, connection, opts);
}

util.inherits(Driver, postgres.Driver);

Driver.prototype.insert = function (table, data, id_prop, cb) {
	var q = this.query.insert()
	                  .into(table)
	                  .set(data)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('postgres', q);
	}
	this.execQuery(q, function (err, result) {
		if (err) {
			return cb(err);
		}

		if (id_prop === null) {
			return cb(null);
		}

		if (id_prop.length == 1) {
			return this.execQuery("SELECT LASTVAL() AS id", function (err, results) {
				return cb(null, {
					id: !err && results[0].id || null
				});
			});
		}

		var ids = {};

		for (var i = 0; i < id_prop.length; i++) {
			ids[id_prop[i]] = data[id_prop[i]] || null;
		}

		return cb(null, ids);
	}.bind(this));
};
