var postgres       = require("pg"),
	connectionString = '';

exports.Driver = Driver;

function Driver(config, connection, opts) {
	this.connectionString = "postgresql"+config.href.substring(14);
	this.config = config || {};
	this.opts   = opts || {};
	this.db = postgres;
	var escapes = {
		escape   : this.escape.bind(this),
		escapeId : this.escapeId.bind(this)
	};

	this.QuerySelect = new (require("../../sql/Select"))(escapes);
	this.QueryInsert = new (require("../../sql/Insert"))(escapes);
	this.QueryUpdate = new (require("../../sql/Update"))(escapes);
	this.QueryRemove = new (require("../../sql/Remove"))(escapes);
}
Driver.prototype.sync = function (opts, cb) {
	return require("../DDL/postgres").sync(this, opts, cb);
};

Driver.prototype.drop = function (opts, cb) {
	return require("../DDL/postgres").drop(this, opts, cb);
};

Driver.prototype.ping = function (cb) {
	this.db.query("SELECT * FROM pg_stat_activity LIMIT 1", function () {
		return cb();
	});
	return this;
};

Driver.prototype.connect = function (cb) {
	//console.log("connect called");
	cb(null);
	//this.db.connect(cb);
};

Driver.prototype.close = function (cb) {
	//console.log("end called");
	cb(null);
	//
	//this.db.end(cb);
};
Driver.prototype.on = function (ev, cb) {
	//console.log("Driver.on called");
	//console.log(ev);
	if (ev == "error") {
//		this.db.on("error", cb);
	}
	return this;
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
	}
	if (opts.order) {
		this.QuerySelect.order(opts.order[0], opts.order[1]);
	}
	for (var k in conditions) {
		this.QuerySelect.where(k, conditions[k]);
	}

	if (this.opts.debug) {
		require("../Debug").sql('postgres', this.QuerySelect.build());
	}
	this.hijackQuery(this.QuerySelect.build(), handleQuery(cb));
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
		require("../../Debug").sql('postgres', this.QuerySelect.build());
	}
	this.hijackQuery(this.QuerySelect.build(), handleQuery(cb));
};
Driver.prototype.insert = function (table, data, id_prop, cb) {
	this.QueryInsert
		.clear()
		.table(table);
	for (var k in data) {
		this.QueryInsert.set(k, data[k]);
	}
	if (this.opts.debug) {
		require("../../Debug").sql('postgres', this.QueryInsert.build());
	}
	this.hijackQuery(this.QueryInsert.build() + " RETURNING *", function (err, result) {
		if (err) {
			return cb(err);
		}
		return cb(null, {
			id: result.rows[0][id_prop] || null
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
	if (this.opts.debug) {
		require("../../Debug").sql('postgres', this.QueryUpdate.build());
	}
	this.hijackQuery(this.QueryUpdate.build(), handleQuery(cb));
};

Driver.prototype.remove = function (table, conditions, cb) {
	this.QueryRemove
		.clear()
		.table(table);
	for (var k in conditions) {
		this.QueryRemove.where(k, conditions[k]);
	}

	if (this.opts.debug) {
		require("../../Debug").sql('postgres', this.QueryRemove.build());
	}
	this.hijackQuery(this.QueryRemove.build(), handleQuery(cb));
};

Driver.prototype.clear = function (table, cb) {
	var query = "TRUNCATE TABLE " + escapeId(table);

	if (this.opts.debug) {
		require("../../Debug").sql('postgres', query);
	}
	this.hijackQuery(query, handleQuery(cb));
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

Driver.prototype.hijackQuery = function (receievedQuery, cb) {

  this.db.connect(this.connectionString, function(err, client) {
	  if(err){
		  console.log("Error from PostgresAxomic");
		  console.log(err);
	  }
	client.query(receievedQuery, cb);
  })
}

Driver.prototype.escapeId = function (id) {
	var m = id.match(/^(.+)\.\*$/);
	if (m) {
		return '"' + m[1].replace(/\"/g, '""') + '".*';
	}
	return '"' + id.replace(/\"/g, '""').replace(/\./g, '"."') + '"';
};

Driver.prototype.escape = function (value) {
	if (Array.isArray(value)) {
		if (value.length === 1 && Array.isArray(value[0])) {
			return "(" + value[0].map(this.escape.bind(this)) + ")";
		}
		return "(" + value.map(this.escape.bind(this)) + ")";
	}
	switch (typeof value) {
		case "number":
			return value;
	}


	if(!value) {
		return value
	} else {
		return "'" + value.replace(/\'/g, "''") + "'";
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




