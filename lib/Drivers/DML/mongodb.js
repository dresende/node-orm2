var mongodb = require("mongodb");

exports.Driver = Driver;

function Driver(config, connection, opts) {
	this.client = new mongodb.MongoClient();
	this.db     = null;
	this.config = config || {};
	this.opts   = opts || {};
}

Driver.prototype.sync = function (opts, cb) {
	if (typeof cb == "function") {
		return process.nextTick(cb);
	}
};

Driver.prototype.drop = function (opts, cb) {
	if (typeof cb == "function") {
		return process.nextTick(cb);
	}
};

Driver.prototype.ping = function (cb) {
	return process.nextTick(cb);
};

Driver.prototype.on = function (ev, cb) {
	// if (ev == "error") {
	// 	this.db.on("error", cb);
	// 	this.db.on("unhandledError", cb);
	// }
	return this;
};

Driver.prototype.connect = function (cb) {
	console.log("connecting...");
	this.client.connect(this.config.href, function (err, db) {
		console.log("err", err);
		if (err) {
			return cb(err);
		}

		this.db = db;

		return cb();
	}.bind(this));
};

Driver.prototype.close = function (cb) {
	if (this.db) {
		this.db.close();
	}
	if (typeof cb == "function") {
		cb();
	}
	return;
};

Driver.prototype.find = function (fields, table, conditions, opts, cb) {
	var collection = this.db.collection(table);
	var cursor     = collection.find(conditions, fields);

	if (opts.order) {
		var orders = [];

		for (var i = 0; i < opts.order.length; i++) {
			orders.push([ opts.order[i][0], (opts.order[i][1] == 'Z' ? 'desc' : 'asc') ]);
		}
		cursor.sort(orders);
	}
	if (opts.offset) {
		cursor.skip(opts.offset);
	}
	if (opts.limit) {
		cursor.limit(opts.limit);
	}

	return cursor.toArray(function (err, docs) {
		for (var i = 0; i < docs.length; i++) {
			docs[i]._id = docs[i]._id.toString();
		}
		return cb(err, docs);
	});
};

Driver.prototype.count = function (table, conditions, opts, cb) {
	var collection = this.db.collection(table);
	var cursor     = collection.find(conditions);

	if (opts.order) {
		var orders = [];

		for (var i = 0; i < opts.order.length; i++) {
			orders.push([ opts.order[i][0], (opts.order[i][1] == 'Z' ? 'desc' : 'asc') ]);
		}
		cursor.sort(orders);
	}
	if (opts.offset) {
		cursor.skip(opts.offset);
	}
	if (opts.limit) {
		cursor.limit(opts.limit);
	}

	return cursor.count(true, cb);
};

Driver.prototype.insert = function (table, data, id_prop, cb) {
	convertToDB(data);

	return this.db.collection(table).insert(
		data,
		{
			w : 1
		},
		function (err, docs) {
			if (err) return cb(err);

			var ids = {};

			if (id_prop !== null && docs.length) {
				for (var k in docs[0]) {
					if (id_prop.indexOf(k) >= 0) {
						ids[k] = docs[0][k];
					}
				}
				convertFromDB(ids);
			}

			return cb(null, ids);
		}
	);
};

Driver.prototype.update = function (table, changes, conditions, cb) {
	convertToDB(conditions);

	return this.db.collection(table).update(
		conditions,
		{
			$set   : changes
		},
		{
			safe   : true,
			upsert : true
		},
		cb
	);
};

Driver.prototype.remove = function (table, conditions, cb) {
	return this.db.collection(table).remove(conditions, cb);
};

Driver.prototype.clear = function (table, cb) {
	return this.db.collection(table).drop(cb);
};


function convertToDB(obj) {
	for (var k in obj) {
		if (k == "_id") {
			if (obj[k] instanceof mongodb.ObjectID) {
				console.log("!!!!!!!!");
			}
			obj[k] = new mongodb.ObjectID(obj[k]);
		}
	}
}

function convertFromDB(obj) {
	for (var k in obj) {
		if (obj[k] instanceof mongodb.ObjectID) {
			obj[k] = obj[k].toString();
		}
	}
}
