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
	this.db.query(q, function (err, result) {
		if (err) {
			return cb(err);
		}

		this.db.query("SELECT LASTVAL() AS id", function (err, result) {
			return cb(null, {
				id: !err && result.rows[0].id || null
			});
		});
	}.bind(this));
};
