var sqlite3 = require("sqlite3");

exports.Driver = Driver;

function Driver(config, connection, opts) {
	this.config = config || {};
	this.opts   = opts || {};
	if (connection) {
		this.db = connection;
	} else {
		// on Windows, paths have a drive letter which is parsed by
		// url.parse() has the hostname. If host is defined, assume
		// it's the drive letter and add ":"
		this.db = new sqlite3.Database(((config.host ? config.host + ":" : "") + (config.pathname || "")) || ':memory:');
	}

	var escapes = {
		escape   : escape,
		escapeId : this.escapeId.bind(this)
	};

	this.QuerySelect = new (require("../../sql/Select"))(escapes);
	this.QueryInsert = new (require("../../sql/Insert"))(escapes);
	this.QueryUpdate = new (require("../../sql/Update"))(escapes);
	this.QueryRemove = new (require("../../sql/Remove"))(escapes);
}

Driver.prototype.sync = function (opts, cb) {
	return require("../DDL/sqlite").sync(this, opts, cb);
};

Driver.prototype.drop = function (opts, cb) {
	return require("../DDL/sqlite").drop(this, opts, cb);
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
		// OFFSET cannot be used without LIMIT so we use the biggest INTEGER number possible
		this.QuerySelect.limit('9223372036854775807');
	}
	if (opts.order) {
		this.QuerySelect.order(opts.order[0], opts.order[1]);
	}
	for (var k in conditions) {
		this.QuerySelect.where(k, conditions[k]);
	}

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', this.QuerySelect.build());
	}
	this.db.all(this.QuerySelect.build(), cb);
};

Driver.prototype.count = function (table, conditions, cb) {
	this.QuerySelect
		.clear()
		.count()
		.table(table);
	for (var k in conditions) {
		this.QuerySelect.where(k, conditions[k]);
	}

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', this.QuerySelect.build());
	}
	this.db.all(this.QuerySelect.build(), cb);
};

Driver.prototype.insert = function (table, data, cb) {
	this.QueryInsert
		.clear()
		.table(table);
	for (var k in data) {
		this.QueryInsert.set(k, data[k]);
	}

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', this.QueryInsert.build());
	}
	this.db.all(this.QueryInsert.build(), function (err, info) {
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
	this.QueryUpdate
		.clear()
		.table(table);
	for (var k in conditions) {
		this.QueryUpdate.where(k, conditions[k]);
	}
	for (k in changes) {
		this.QueryUpdate.set(k, changes[k]);
	}

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', this.QueryUpdate.build());
	}
	this.db.all(this.QueryUpdate.build(), cb);
};

Driver.prototype.remove = function (table, conditions, cb) {
	this.QueryRemove
		.clear()
		.table(table);
	for (var k in conditions) {
		this.QueryRemove.where(k, conditions[k]);
	}

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', this.QueryRemove.build());
	}
	this.db.all(this.QueryRemove.build(), cb);
};

Driver.prototype.clear = function (table, cb) {
	var query = "DELETE FROM " + this.escapeId(table);

	if (this.opts.debug) {
		require("../../Debug").sql('sqlite', query);
	}
	this.db.all(query, cb);
};

Driver.prototype.escapeId = function (id) {
	var m = id.match(/^(.+)\.\*$/);
	if (m) {
		return '`' + m[1].replace(/\`/g, '``') + '`.*';
	}
	return '`' + id.replace(/\`/g, '``').replace(/\./g, '`.`') + '`';
};

function escape(value) {
	if (Array.isArray(value)) {
		if (value.length === 1 && Array.isArray(value[0])) {
			return "(" + value[0].map(escape) + ")";
		}
		return "(" + value.map(escape) + ")";
	}
	switch (typeof value) {
		case "number":
			return value;
	}

	return "'" + value.replace(/\'/g, "''") + "'";
}
