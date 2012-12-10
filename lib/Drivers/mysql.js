var mysql       = require("mysql");

exports.Driver = Driver;

function Driver(opts, connection) {
	this.opts = opts || {};
	if (!this.opts.timezone) {
		// force UTC if not defined, UTC is always better..
		this.opts.timezone = "Z";
	}
	this.db = (connection ? connection : mysql.createConnection(opts));

	var escapes = {
		escape   : this.db.escape,
		escapeId : escapeId
	};

	this.QuerySelect = new (require("../sql/Select"))(escapes);
	this.QueryInsert = new (require("../sql/Insert"))(escapes);
	this.QueryUpdate = new (require("../sql/Update"))(escapes);
	this.QueryRemove = new (require("../sql/Remove"))(escapes);
}

Driver.prototype.connect = function (cb) {
	this.db.connect(cb);
};

Driver.prototype.close = function (cb) {
	this.db.end(cb);
};

Driver.prototype.find = function (table, conditions, opts, cb) {
	this.QuerySelect
		.clear()
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

	this.db.query(this.QuerySelect.build(), cb);
};

Driver.prototype.insert = function (table, data, cb) {
	this.QueryInsert
		.clear()
		.table(table);
	for (var k in data) {
		this.QueryInsert.set(k, data[k]);
	}

	this.db.query(this.QueryInsert.build(), function (err, info) {
		if (err) {
			return cb(err);
		}
		return cb(null, {
			id: info.insertId
		});
	});
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

	this.db.query(this.QueryUpdate.build(), cb);
};

Driver.prototype.remove = function (table, conditions, cb) {
	this.QueryRemove
		.clear()
		.table(table);
	for (var k in conditions) {
		this.QueryRemove.where(k, conditions[k]);
	}

	this.db.query(this.QueryRemove.build(), cb);
};

Driver.prototype.clear = function (table, cb) {
	this.db.query("TRUNCATE TABLE " + escapeId(table), cb);
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

function escapeId(id) {
	var m = id.match(/^(.+)\.\*$/);
	if (m) {
		return '`' + m[1].replace(/\`/g, '``') + '`.*';
	}
	return '`' + id.replace(/\`/g, '``').replace(/\./g, '`.`') + '`';
}
