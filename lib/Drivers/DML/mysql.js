var mysql = require("mysql");
var Query = require("sql-query").Query;

exports.Driver = Driver;

function Driver(config, connection, opts) {
	this.config = config || {};
	this.opts   = opts || {};
	this.query  = new Query("mysql");

	if (!this.config.timezone) {
		// force UTC if not defined, UTC is always better..
		this.config.timezone = "Z";
	}

	this.reconnect(null, connection);

	this.aggregate_functions = [ "ABS", "CEIL", "FLOOR", "ROUND",
	                             "AVG", "MIN", "MAX",
	                             "LOG", "LOG2", "LOG10", "EXP", "POWER",
	                             "ACOS", "ASIN", "ATAN", "COS", "SIN", "TAN",
	                             "CONV", [ "RANDOM", "RAND" ], "RADIANS", "DEGREES",
	                             "SUM", "COUNT" ];
}

Driver.prototype.sync = function (opts, cb) {
	return require("../DDL/mysql").sync(this, opts, cb);
};

Driver.prototype.drop = function (opts, cb) {
	return require("../DDL/mysql").drop(this, opts, cb);
};

Driver.prototype.ping = function (cb) {
	this.db.ping(cb);
	return this;
};

Driver.prototype.on = function (ev, cb) {
	if (ev == "error") {
		this.db.on("error", cb);
		this.db.on("unhandledError", cb);
	}
	return this;
};

Driver.prototype.connect = function (cb) {
	if (this.opts.pool) {
		return this.db.pool.getConnection(function (err, con) {
			if (!err) {
				con.end();
			}
			return cb(err);
		});
	}
	this.db.connect(cb);
};

Driver.prototype.reconnect = function (cb, connection) {
	this.db = (connection ? connection : mysql.createConnection(this.config.href || this.config));
	if (this.opts.pool) {
		this.db.pool = (connection ? connection : mysql.createPool(this.config.href || this.config));
	}
	if (typeof cb == "function") {
		this.connect(cb);
	}
};

Driver.prototype.close = function (cb) {
	if (this.opts.pool) {
		return cb();
	}
	this.db.end(cb);
};

Driver.prototype.getQuery = function () {
	return this.query;
};

Driver.prototype.execQuery = function (query, cb) {
	if (this.opts.pool) {
		this.poolQuery(query, cb);
	} else {
		this.db.query(query, cb);
	}
};

Driver.prototype.find = function (fields, table, conditions, opts, cb) {
	var q = this.query.select()
	                  .from(table).select(fields);

	if (opts.offset) {
		q.offset(opts.offset);
	}
	if (typeof opts.limit == "number") {
		q.limit(opts.limit);
	} else if (opts.offset) {
		// OFFSET cannot be used without LIMIT so we use the biggest BIGINT number possible
		q.limit('18446744073709551615');
	}
	if (opts.order) {
		q.order(opts.order[0], opts.order[1]);
	}

	if (opts.merge) {
		q.from(opts.merge.from.table, opts.merge.from.field, opts.merge.to.field);
		if (opts.merge.where && Object.keys(opts.merge.where[1]).length) {
			q = q.where(opts.merge.where[0], opts.merge.where[1], conditions);
		} else {
			q = q.where(conditions);
		}
	} else {
		q = q.where(conditions);
	}

	if (opts.exists) {
		for (var k in opts.exists) {
			q.whereExists(opts.exists[k].table, table, opts.exists[k].link, opts.exists[k].conditions);
		}
	}

	q = q.build();

	if (this.opts.pool) {
		this.poolQuery(q, cb);
	} else {
		this.db.query(q, cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', q);
	}
};

Driver.prototype.count = function (table, conditions, opts, cb) {
	var q = this.query.select()
	                  .from(table)
	                  .count(opts.id, 'c');

	if (opts.merge) {
		q.from(opts.merge.from.table, opts.merge.from.field, opts.merge.to.field);
		if (opts.merge.where && Object.keys(opts.merge.where[1]).length) {
			q = q.where(opts.merge.where[0], opts.merge.where[1], conditions);
		} else {
			q = q.where(conditions);
		}
	} else {
		q = q.where(conditions);
	}

	if (opts.exists) {
		for (var k in opts.exists) {
			q.whereExists(opts.exists[k].table, table, opts.exists[k].link, opts.exists[k].conditions);
		}
	}

	q = q.build();

	if (this.opts.pool) {
		this.poolQuery(q, cb);
	} else {
		this.db.query(q, cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', q);
	}
};

Driver.prototype.insert = function (table, data, id_prop, cb) {
	var q = this.query.insert()
	                  .into(table)
	                  .set(data)
	                  .build();

	if (this.opts.pool) {
		this.poolQuery(q, function (err, info) {
			if (err) return cb(err);

			return cb(null, { id: info.insertId });
		});
	} else {
		this.db.query(q, function (err, info) {
			if (err) return cb(err);

			return cb(null, { id: info.insertId });
		});
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', q);
	}
};

Driver.prototype.update = function (table, changes, conditions, cb) {
	var q = this.query.update()
	                  .into(table)
	                  .set(changes)
	                  .where(conditions)
	                  .build();

	if (this.opts.pool) {
		this.poolQuery(q, cb);
	} else {
		this.db.query(q, cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', q);
	}
};

Driver.prototype.remove = function (table, conditions, cb) {
	var q = this.query.remove()
	                  .from(table)
	                  .where(conditions)
	                  .build();

	if (this.opts.pool) {
		this.poolQuery(q, cb);
	} else {
		this.db.query(q, cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', q);
	}
};

Driver.prototype.clear = function (table, cb) {
	var q = "TRUNCATE TABLE " + this.query.escapeId(table);

	if (this.opts.pool) {
		this.poolQuery(q, cb);
	} else {
		this.db.query(q, cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', q);
	}
};

Driver.prototype.poolQuery = function (query, cb) {
	this.db.pool.getConnection(function (err, con) {
		if (err) {
			return cb(err);
		}

		con.query(query, function (err, data) {
			con.end();

			return cb(err, data);
		});
	});
};

Driver.prototype.valueToProperty = function (value, property) {
	switch (property.type) {
		case "boolean":
			return !!value;
		case "object":
			try {
				return JSON.parse(value);
			} catch (e) {
				return null;
			}
			break;
		default:
			return value;
	}
};

Driver.prototype.propertyToValue = function (value, property) {
	switch (property.type) {
		case "boolean":
			return (value) ? 1 : 0;
		case "object":
			return JSON.stringify(value);
		default:
			return value;
	}
};
