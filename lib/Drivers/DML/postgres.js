var pg    = require("pg");
var Query = require("sql-query").Query;

exports.Driver = Driver;

function Driver(config, connection, opts) {
	var functions = switchableFunctions.client;
	this.config = config || {};
	this.opts   = opts || {};
	this.query  = new Query("postgresql");

	if (connection) {
		this.db = connection;
	} else {
		if (config.query && config.query.ssl) {
			config.ssl = true;
			this.config = config;
		} else {
			this.config = config.href || config;
		}

		if (opts.pool) {
			functions = switchableFunctions.pool;
			this.db = pg;
		} else {
			this.db = new pg.Client(this.config);
		}
	}

	for (var name in functions) {
		this.constructor.prototype[name] = functions[name];
	}

	this.aggregate_functions = [ "ABS", "CEIL", "FLOOR", "ROUND",
	                             "AVG", "MIN", "MAX",
	                             "LOG", "EXP", "POWER",
	                             "ACOS", "ASIN", "ATAN", "COS", "SIN", "TAN",
	                             "RANDOM", "RADIANS", "DEGREES",
	                             "SUM", "COUNT",
	                             "DISTINCT" ];
}

var switchableFunctions = {
	pool: {
		connect: function (cb) {
			this.db.connect(this.config, function (err, client, done) {
				if (!err) done();
				cb(err);
			});
		},
		execQuery: function (query, cb) {
			if (this.opts.debug) {
				require("../../Debug").sql('mysql', query);
			}
			this.db.connect(this.config, function (err, client, done) {
				if (err) return cb(err);

				client.query(query, function (err, result) {
					done();

					if (err) {
						cb(err);
					} else {
						cb(null, result.rows);
					}
				});
			});
			return this;
		},
		on: function(ev, cb) {
			// Because `pg` is the same for all instances of this driver
			// we can't keep adding listeners since they are never removed.
			return this;
		}
	},
	client: {
		connect: function (cb) {
			this.db.connect(cb);
		},
		execQuery: function (query, cb) {
			if (this.opts.debug) {
				require("../../Debug").sql('mysql', query);
			}
			this.db.query(query, function (err, result) {
				if (err) {
					cb(err);
				} else {
					cb(null, result.rows);
				}
			});
			return this;
		},
		on: function(ev, cb) {
			if (ev == "error") {
				this.db.on("error", cb);
			}
			return this;
		}
	}
};

Driver.prototype.sync = function (opts, cb) {
	return require("../DDL/postgres").sync(this, opts, cb);
};

Driver.prototype.drop = function (opts, cb) {
	return require("../DDL/postgres").drop(this, opts, cb);
};

Driver.prototype.ping = function (cb) {
	this.execQuery("SELECT * FROM pg_stat_activity LIMIT 1", function () {
		return cb();
	});
	return this;
};

Driver.prototype.close = function (cb) {
	this.db.end(cb);
};

Driver.prototype.getQuery = function () {
	return this.query;
};

Driver.prototype.find = function (fields, table, conditions, opts, cb) {
	var q = this.query.select()
	                  .from(table).select(fields);

	if (opts.offset) {
		q.offset(opts.offset);
	}
	if (typeof opts.limit == "number") {
		q.limit(opts.limit);
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
		require("../../Debug").sql('postgres', q);
	}
	this.execQuery(q, cb);
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
		require("../../Debug").sql('postgres', q);
	}
	this.execQuery(q, cb);
};

Driver.prototype.insert = function (table, data, id_prop, cb) {
	var q = this.query.insert()
	                  .into(table)
	                  .set(data)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('postgres', q);
	}
	this.execQuery(q + " RETURNING *", function (err, results) {
		if (err) {
			return cb(err);
		}

		var ids = {};

		if (id_prop !== null) {
			for (var i = 0; i < id_prop.length; i++) {
				ids[id_prop[i]] = results[0][id_prop[i]] || null;
			}
		}

		return cb(null, ids);
	});
};

Driver.prototype.update = function (table, changes, conditions, cb) {
	var q = this.query.update()
	                  .into(table)
	                  .set(changes)
	                  .where(conditions)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('postgres', q);
	}
	this.execQuery(q, cb);
};

Driver.prototype.remove = function (table, conditions, cb) {
	var q = this.query.remove()
	                  .from(table)
	                  .where(conditions)
	                  .build();

	if (this.opts.debug) {
		require("../../Debug").sql('postgres', q);
	}
	this.execQuery(q, cb);
};

Driver.prototype.clear = function (table, cb) {
	var q = "TRUNCATE TABLE " + this.query.escapeId(table);

	if (this.opts.debug) {
		require("../../Debug").sql('postgres', q);
	}
	this.execQuery(q, cb);
};

Driver.prototype.valueToProperty = function (value, property) {
	switch (property.type) {
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
		case "point":
			if (typeof value == "string") {
				var m = value.match(/\((\-?[\d\.]+)[\s,]+(\-?[\d\.]+)\)/);
				if (m) {
					return { x : parseFloat(m[1], 10) , y : parseFloat(m[2], 10) };
				}
			}
			return value;
		case "number":
			if (value !== null) {
				return Number(value);
			}
		default:
			return value;
	}
};

Driver.prototype.propertyToValue = function (value, property) {
	switch (property.type) {
		case "object":
			return JSON.stringify(value);
		case "point":
			return function () {
				return "POINT(" + value.x + ', ' + value.y + ")";
			};
		default:
			return value;
	}
};
