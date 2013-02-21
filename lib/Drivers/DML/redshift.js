var util     = require("util");
var postgres = require("./postgres");

exports.Driver = Driver;

function Driver(config, connection, opts) {
	postgres.Driver.call(this, config, connection, opts);
}

util.inherits(Driver, postgres.Driver);

Driver.prototype.insert = function (table, data, cb) {
	this.QueryInsert
		.clear()
		.table(table);
	for (var k in data) {
		this.QueryInsert.set(k, data[k]);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('postgres', this.QueryInsert.build());
	}
	this.db.query(this.QueryInsert.build(), function (err, result) {
		if (err) {
			return cb(err);
		}

		this.db.query("SELECT LASTVAL() AS id", function (err, result) {
			if (err) {
				return cb(err);
			}

			return cb(null, {
				id: result.rows[0].id || null
			});
		});
	}.bind(this));
};
