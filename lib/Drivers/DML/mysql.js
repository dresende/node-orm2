var mysql       = require("mysql");

exports.Driver = Driver;

function Driver(config, connection, opts) {
	this.config = config || {};
	this.opts   = opts || {};

	if (!this.config.timezone) {
		// force UTC if not defined, UTC is always better..
		this.config.timezone = "Z";
	}

	this.db = (connection ? connection : mysql.createConnection(config.href || config));
	if (this.opts.pool) {
		this.db.pool = (connection ? connection : mysql.createPool(config.href || config));
	}

	var escapes = {
		escape   : this.db.escape.bind(this.db),
		escapeId : this.escapeId.bind(this)
	};

	this.QuerySelect = new (require("../../sql/Select"))(escapes);
	this.QueryInsert = new (require("../../sql/Insert"))(escapes);
	this.QueryUpdate = new (require("../../sql/Update"))(escapes);
	this.QueryRemove = new (require("../../sql/Remove"))(escapes);
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

Driver.prototype.close = function (cb) {
	if (this.opts.pool) {
		return cb();
	}
	this.db.end(cb);
};

Driver.prototype.find = function (fields, table, conditions, opts, cb) {
	this.QuerySelect
		.clear()
		.fields(fields)
		.table(table);
	if (opts.fields) {
		this.QuerySelect.fields(opts.fields);
	}
	if (opts.merge) {
		this.QuerySelect.merge(opts.merge.from, opts.merge.to);
	}
	if (opts.offset) {
		this.QuerySelect.offset(opts.offset);
	}
	if (typeof opts.limit == "number") {
		this.QuerySelect.limit(opts.limit);
	} else if (opts.offset) {
		// OFFSET cannot be used without LIMIT so we use the biggest BIGINT number possible
		this.QuerySelect.limit('18446744073709551615');
	}
	if (opts.order) {
		this.QuerySelect.order(opts.order[0], opts.order[1]);
	}
	for (var k in conditions) {
		this.QuerySelect.where(k, conditions[k]);
	}

	if (this.opts.pool) {
		this.poolQuery(this.QuerySelect.build(), cb);
	} else {
		this.db.query(this.QuerySelect.build(), cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', this.QuerySelect.build());
	}
};

Driver.prototype.count = function (table, conditions, cb) {
	this.QuerySelect
		.clear()
		.count()
		.table(table);
	for (var k in conditions) {
		this.QuerySelect.where(k, conditions[k]);
	}

	if (this.opts.pool) {
		this.poolQuery(this.QuerySelect.build(), cb);
	} else {
		this.db.query(this.QuerySelect.build(), cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', this.QuerySelect.build());
	}
};

Driver.prototype.insert = function (table, data, id_prop, cb) {
	this.QueryInsert
		.clear()
		.table(table);
	for (var k in data) {
		this.QueryInsert.set(k, data[k]);
	}

	if (this.opts.pool) {
		this.poolQuery(this.QueryInsert.build(), function (err, info) {
			if (err) return cb(err);

			return cb(null, { id: info.insertId });
		});
	} else {
		this.db.query(this.QueryInsert.build(), function (err, info) {
			if (err) return cb(err);

			return cb(null, { id: info.insertId });
		});
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', this.QueryInsert.build());
	}
};

Driver.prototype.update = function (table, changes, conditions, cb) {
	this.QueryUpdate
		.clear()
		.table(table);
	for (var k in conditions) {
		this.QueryUpdate.where(k, conditions[k]);
	}
	for (k in changes) {
		this.QueryUpdate.set(k, changes[k]);
	}

	if (this.opts.pool) {
		this.poolQuery(this.QueryUpdate.build(), cb);
	} else {
		this.db.query(this.QueryUpdate.build(), cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', this.QueryUpdate.build());
	}
};

Driver.prototype.remove = function (table, conditions, cb) {
	this.QueryRemove
		.clear()
		.table(table);
	for (var k in conditions) {
		this.QueryRemove.where(k, conditions[k]);
	}

	if (this.opts.pool) {
		this.poolQuery(this.QueryRemove.build(), cb);
	} else {
		this.db.query(this.QueryRemove.build(), cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', this.QueryRemove.build());
	}
};

Driver.prototype.clear = function (table, cb) {
	var query = "TRUNCATE TABLE " + this.escapeId(table);

	if (this.opts.pool) {
		this.poolQuery(query, cb);
	} else {
		this.db.query(query, cb);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('mysql', query);
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

Driver.prototype.escapeId = function (id) {
	var m = id.match(/^(.+)\.\*$/);
	if (m) {
		return '`' + m[1].replace(/\`/g, '``') + '`.*';
	}
	return '`' + id.replace(/\`/g, '``').replace(/\./g, '`.`') + '`';
};
