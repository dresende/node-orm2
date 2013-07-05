var sqlite3 = require("sqlite3");
var Query   = require("sql-query").Query;

exports.Driver = Driver;

function Driver(config, connection, opts) {
	this.config = config || {};
	this.opts   = opts || {};
	this.query  = new Query("sqlite");

	if (connection) {
		this.db = connection;
	} else {
		// on Windows, paths have a drive letter which is parsed by
		// url.parse() as the hostname. If host is defined, assume
		// it's the drive letter and add ":"
		this.db = new sqlite3.Database(((config.host ? config.host + ":" : "") + (config.pathname || "")) || ':memory:');
	}

	this.aggregate_functions = [ "ABS", "ROUND",
	                             "AVG", "MIN", "MAX",
	                             "RANDOM",
	                             "SUM", "COUNT",
	                             "DISTINCT" ];
}

Driver.prototype.sync = function (opts, cb) {
	return require("../DDL/sqlite").sync(this, opts, cb);
};

Driver.prototype.drop = function (opts, cb) {
	return require("../DDL/sqlite").drop(this, opts, cb);
};

Driver.prototype.ping = function (cb) {
	process.nextTick(cb);
	return this;
};

Driver.prototype.on = function (ev, cb) {
	if (ev == "error") {
		this.db.on("error", cb);
	}
	return this;
};

Driver.prototype.connect = function (cb) {
	process.nextTick(cb);
};

Driver.prototype.close = function (cb) {
	this.db.close();
	if (typeof cb == "function") process.nextTick(cb);
};

Driver.prototype.getQuery = function () {
	return this.query;
};

Driver.prototype.execQuery = function (query, cb) {
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', query);
	}
	this.db.all(query, cb);
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
		// OFFSET cannot be used without LIMIT so we use the biggest INTEGER number possible
		q.limit('9223372036854775807');
	}
	if (opts.order) {
		for (var i = 0; i < opts.order.length; i++) {
			q.order(opts.order[i][0], opts.order[i][1]);
		}
	}

	if (opts.merge) {
		q.from(opts.merge.from.table, opts.merge.from.field, opts.merge.to.field).select(opts.merge.select);
		if (opts.merge.where && Object.keys(opts.merge.where[1]).length) {
			q = q.where(opts.merge.where[0], opts.merge.where[1], opts.merge.table || null, conditions);
		} else {
			q = q.where(opts.merge.table || null, conditions);
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

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', q);
	}
	this.db.all(q, cb);
};

Driver.prototype.count = function (table, conditions, opts, cb) {
	var q = this.query.select()
	                  .from(table)
	                  .count(null, 'c');

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

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', q);
	}
	this.db.all(q, cb);
};

Driver.prototype.insert = function (table, data, id_prop, cb) {
	var q = this.query.insert()
	                  .into(table)
	                  .set(data)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', q);
	}
	this.db.all(q, function (err, info) {
		if (err) {
			return cb(err);
		}
		this.db.get("SELECT last_insert_rowid() AS last_row_id", function (err, row) {
			if (err) {
				return cb(err);
			}
			return cb(null, {
				id: row.last_row_id
			});
		});
	}.bind(this));
};

Driver.prototype.update = function (table, changes, conditions, cb) {
	var q = this.query.update()
	                  .into(table)
	                  .set(changes)
	                  .where(conditions)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', q);
	}
	this.db.all(q, cb);
};

Driver.prototype.remove = function (table, conditions, cb) {
	var q = this.query.remove()
	                  .from(table)
	                  .where(conditions)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', q);
	}
	this.db.all(q, cb);
};

Driver.prototype.clear = function (table, cb) {
	var query = "DELETE FROM " + this.query.escapeId(table);

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', query);
	}
	this.db.all(query, cb);
};

Driver.prototype.valueToProperty = function (value, property) {
	switch (property.type) {
		case "boolean":
			return !!value;
		case "object":
			if (typeof value == "object" && !Buffer.isBuffer(value)) {
				return value;
			}
			try {
				return JSON.parse(value);
			} catch (e) {
				return null;
			}
			break;
		case "date":
			if (typeof value === 'string') {
				if (value.indexOf('Z', value.length - 1) === -1) {
					return new Date(value + 'Z');
				}
			}
			return new Date(value);
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
		case "date":
			if (this.config.query.strdates) {
				if (value instanceof Date) {
					var year = value.getUTCFullYear();
					var month = value.getUTCMonth() + 1;
					if (month < 10) {
						month = '0' + month;
					}
					var date = value.getUTCDate();
					if (date < 10) {
						date = '0' + date;
					}
					var strdate = year + '-' + month + '-' + date;
					if (property.time === false) {
						return strdate;
					}

					var hours = value.getUTCHours();
					if (hours < 10) {
						hours = '0' + hours;
					}
					var minutes = value.getUTCMinutes();
					if (minutes < 10) {
						minutes = '0' + minutes;
					}
					var seconds = value.getUTCSeconds();
					if (seconds < 10) {
						seconds = '0' + seconds;
					}
					var millis = value.getUTCMilliseconds();
					if (millis < 10) {
						millis = '0' + millis;
					}
					if (millis < 100) {
						millis = '0' + millis;
					}
					strdate += ' ' + hours + ':' + minutes + ':' + seconds + '.' + millis + '000';
					return  strdate;
				}

			}
			return value;
		default:
			return value;
	}
};
