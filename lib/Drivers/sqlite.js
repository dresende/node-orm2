var sqlite3 = require("sqlite3");

exports.Driver = Driver;

function Driver(opts, connection) {
	this.opts = opts || {};
	this.db = (connection ? connection : new sqlite3.Database(opts.pathname));

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
	process.nextTick(cb);
};

Driver.prototype.close = function (cb) {
	this.db.close();
	if (typeof cb == "function") process.nextTick(cb);
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
	if (typeof opts.limit == "number") {
		this.QuerySelect.limit(opts.limit);
	}
	if (opts.order) {
		this.QuerySelect.order(opts.order[0], opts.order[1]);
	}
	for (var k in conditions) {
		this.QuerySelect.where(k, conditions[k]);
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

Driver.prototype.update = function (table, changes, id_prop, id, cb) {
	this.QueryUpdate
		.clear()
		.table(table)
		.where(id_prop, id);
	for (var k in changes) {
		this.QueryUpdate.set(k, changes[k]);
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

	this.db.all(this.QueryRemove.build(), cb);
};

Driver.prototype.clear = function (table, cb) {
	this.db.all("DELETE FROM " + escapeId(table), cb);
};

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
		return '`' + m[1].replace(/\`/g, '``') + '`.*';
	}
	return '`' + id.replace(/\`/g, '``').replace(/\./g, '`.`') + '`';
}
