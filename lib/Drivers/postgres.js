var postgres       = require("pg");

exports.Driver = Driver;

function Driver(opts, connection) {
	this.opts = opts || {};
	this.db = (connection ? connection : new postgres.Client(opts));

	var escapes = {
		escape   : escape,
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
	}
	if (opts.order) {
		this.QuerySelect.order(opts.order[0], opts.order[1]);
	}
	for (var k in conditions) {
		this.QuerySelect.where(k, conditions[k]);
	}

	this.db.query(this.QuerySelect.build(), handleQuery(cb));
};

Driver.prototype.insert = function (table, data, cb) {
	this.QueryInsert
		.clear()
		.table(table);
	for (var k in data) {
		this.QueryInsert.set(k, data[k]);
	}

	this.db.query(this.QueryInsert.build() + " RETURNING *", function (err, result) {
		if (err) {
			return cb(err);
		}
		return cb(null, {
			id: result.rows[0].id || null
		});
	});
};

Driver.prototype.update = function (table, changes, id_prop, id, cb) {
	this.QueryUpdate
		.clear()
		.table(table)
		.where(id_prop, id);
	for (var k in changes) {
		this.QueryUpdate.set(k, changes[k]);
	}

	this.db.query(this.QueryUpdate.build(), handleQuery(cb));
};

Driver.prototype.remove = function (table, conditions, cb) {
	this.QueryRemove
		.clear()
		.table(table);
	for (var k in conditions) {
		this.QueryRemove.where(k, conditions[k]);
	}

	this.db.query(this.QueryRemove.build(), handleQuery(cb));
};

Driver.prototype.clear = function (table, cb) {
	this.db.query("TRUNCATE TABLE " + escapeId(table), handleQuery(cb));
};

Driver.prototype.valueToProperty = function (value, property) {
	switch (property.type) {
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
		case "object":
			return JSON.stringify(value);
		default:
			return value;
	}
};

function handleQuery(cb) {
	return function (err, result) {
		if (err) {
			return cb(err);
		}
		return cb(null, result.rows);
	};
}

function escape(value) {
	if (Array.isArray(value)) {
		return "(" + value.map(escape) + ")";
	}
	switch (typeof value) {
		case "number":
			return value;
	}

	return "'" + value.replace(/\'/g, "''") + "'";
}

function escapeId(id) {
	var m = id.match(/^(.+)\.\*$/);
	if (m) {
		return '"' + m[1].replace(/\"/g, '""') + '".*';
	}
	return '"' + id.replace(/\"/g, '""').replace(/\./g, '"."') + '"';
}
