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

Driver.prototype.find = function (table, conditions, limit, order, cb) {
	this.QuerySelect
		.clear()
		.table(table);
	if (typeof limit == "number") {
		this.QuerySelect.limit(limit);
	}
	if (order !== null) {
		this.QuerySelect.order(order[0], order[1]);
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

Driver.prototype.remove = function (table, id_prop, id, cb) {
	this.QueryRemove
		.clear()
		.table(table)
		.where(id_prop, id)
		.limit(1);

	this.db.query(this.QueryRemove.build(), cb);
};

function escapeId(id) {
	return "`" + id.replace(".", "`.`") + "`";
}
