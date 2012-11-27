var mysql       = require("mysql");

exports.Driver = Driver;

function Driver(opts) {
	this.opts = opts || {};
	this.db = mysql.createConnection(opts);

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
	if (typeof opts.limit == "number") {
		this.QuerySelect.limit(opts.limit);
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

Driver.prototype.update = function (table, changes, id_prop, id, cb) {
	this.QueryUpdate
		.clear()
		.table(table)
		.where(id_prop, id)
		.limit(1);
	for (var k in changes) {
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

function escapeId(id) {
	var m = id.match(/^(.+)\.\*$/);
	if (m) {
		return '`' + m[1].replace(/\`/g, '``') + '`.*';
	}
	return '`' + id.replace(/\`/g, '``').replace(/\./g, '`.`') + '`';
}
