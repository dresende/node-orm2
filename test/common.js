var common = exports;
var path   = require('path');
var async  = require('async');
var ORM    = require('../');

common.ORM = ORM;

common.protocol = function () {
	return process.env.ORM_PROTOCOL;
};

common.isTravis = function() {
	return Boolean(process.env.CI);
};

common.createConnection = function(cb) {
	ORM.connect(this.getConnectionString(), cb);
};

common.getConfig = function () {
	if (common.isTravis()) {
		switch (this.protocol()) {
			case 'mysql':
				return { user: "root", host: "localhost", database: "orm_test" };
			case 'postgres':
			case 'redshift':
				return { user: "postgres", host: "localhost", database: "orm_test" };
			case 'sqlite':
				return {};
			default:
				throw new Error("Unknown protocol");
		}
	} else {
		return require("./config")[this.protocol()];
	}
};

common.getConnectionString = function () {
	var url;

	if (common.isTravis()) {
		switch (this.protocol()) {
			case 'mysql':
				return 'mysql://root@localhost/orm_test';
			case 'postgres':
			case 'redshift':
				return 'postgres://postgres@localhost/orm_test';
			case 'sqlite':
				return 'sqlite://';
			default:
				throw new Error("Unknown protocol");
		}
	} else {
		var config = require("./config")[this.protocol()];

		switch (this.protocol()) {
			case 'mysql':
				return 'mysql://' +
				       (config.user || 'root') +
				       (config.password ? ':' + config.password : '') +
				       '@' + (config.host || 'localhost') +
				       '/' + (config.database || 'orm_test');
			case 'postgres':
				return 'postgres://' +
				       (config.user || 'postgres') +
				       (config.password ? ':' + config.password : '') +
				       '@' + (config.host || 'localhost') +
				       '/' + (config.database || 'orm_test');
			case 'redshift':
				return 'redshift://' +
				       (config.user || 'postgres') +
				       (config.password ? ':' + config.password : '') +
				       '@' + (config.host || 'localhost') +
				       '/' + (config.database || 'orm_test');
			case 'sqlite':
				return 'sqlite://' + (config.pathname || "");
			default:
				throw new Error("Unknown protocol");
		}
	}
	return url;
};

common.getModelProperties = function () {
	return {
		name: { type: "text", defaultValue: "test_default_value" }
	};
};

common.createModelTable = function (table, db, cb) {
	switch (this.protocol()) {
		case "postgres":
		case "redshift":
			db.query("CREATE TEMPORARY TABLE " + table + " (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL)", cb);
			break;
		case "sqlite":
			db.run("DROP TABLE IF EXISTS " + table, function () {
				db.run("CREATE TABLE " + table + " (id INTEGER NOT NULL, name VARCHAR(100) NOT NULL, PRIMARY KEY(id))", cb);
			});
			break;
		default:
			db.query("CREATE TEMPORARY TABLE " + table + " (id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL)", cb);
			break;
	}
};

common.createModel2Table = function (table, db, cb) {
	switch (this.protocol()) {
		case "postgres":
		case "redshift":
			db.query("CREATE TEMPORARY TABLE " + table + " (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, assoc_id BIGINT NOT NULL)", cb);
			break;
		case "sqlite":
			db.run("DROP TABLE IF EXISTS " + table, function () {
				db.run("CREATE TEMPORARY TABLE " + table + " (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, assoc_id BIGINT NOT NULL)", cb);
			});
			break;
		default:
			db.query("CREATE TEMPORARY TABLE " + table + " (id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, assoc_id BIGINT NOT NULL)", cb);
			break;
	}
};

common.createModelAssocUpDownTable = function (table, db, cb) {
	switch (this.protocol()) {
		case "postgres":
		case "redshift":
			db.query("CREATE TEMPORARY TABLE " + table + " (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, assocup_id BIGINT NOT NULL, assocdown_id BIGINT NOT NULL)", cb);
			break;
		case "sqlite":
			db.run("DROP TABLE IF EXISTS " + table, function () {
				db.run("CREATE TEMPORARY TABLE " + table + " (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, assocup_id BIGINT NOT NULL, assocdown_id BIGINT NOT NULL)", cb);
			});
			break;
		default:
			db.query("CREATE TEMPORARY TABLE " + table + " (id BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT, name VARCHAR(100) NOT NULL, assocup_id BIGINT NOT NULL, assocdown_id BIGINT NOT NULL)", cb);
			break;
	}
};

common.createKeysModelTable = function (table, db, keys, cb) {
	switch (this.protocol()) {
		case "postgres":
		case "redshift":
			db.query("CREATE TEMPORARY TABLE " + table + " (" + keys.join(" BIGINT NOT NULL, ") + " BIGINT NOT NULL, name VARCHAR(100) NOT NULL, PRIMARY KEY (" + keys.join(", ") + "))", cb);
			break;
		case "sqlite":
			db.run("DROP TABLE IF EXISTS " + table, function () {
				db.run("CREATE TEMPORARY TABLE " + table + " (" + keys.join(" BIGINT NOT NULL, ") + " BIGINT NOT NULL, name VARCHAR(100) NOT NULL, PRIMARY KEY (" + keys.join(", ") + "))", cb);
			});
			break;
		default:
			db.query("CREATE TEMPORARY TABLE " + table + " (" + keys.join(" BIGINT NOT NULL, ") + " BIGINT NOT NULL, name VARCHAR(100) NOT NULL, PRIMARY KEY (" + keys.join(", ") + "))", cb);
			break;
	}
};

common.createModelAssocTable = function (table, assoc, db, cb) {
	switch (this.protocol()) {
		case "postgres":
		case "redshift":
			db.query("CREATE TEMPORARY TABLE " + table + "_" + assoc + " (" + table + "_id BIGINT NOT NULL, " + assoc + "_id BIGINT NOT NULL, extra_field BIGINT)", cb);
			break;
		case "sqlite":
			db.run("DROP TABLE IF EXISTS " + table + "_" + assoc, function () {
				db.run("CREATE TABLE " + table + "_" + assoc + " (" + table + "_id INTEGER NOT NULL, " + assoc + "_id INTEGER NOT NULL, extra_field INTEGER)", cb);
			});
			break;
		default:
			db.query("CREATE TEMPORARY TABLE " + table + "_" + assoc + " (" + table + "_id BIGINT NOT NULL, " + assoc + "_id BIGINT NOT NULL, extra_field BIGINT)", cb);
			break;
	}
};

common.insertModelData = function (table, db, data, cb) {
	var query = [], i;

	switch (this.protocol()) {
		case "postgres":
		case "redshift":
		case "mysql":
			query = [];

			for (i = 0; i < data.length; i++) {
				query.push(data[i].id + ", '" + data[i].name + "'");
			}

			db.query("INSERT INTO " + table + " VALUES (" + query.join("), (") + ")", cb);
			break;
		case "sqlite":
			var pending = data.length;
			for (i = 0; i < data.length; i++) {
				db.run("INSERT INTO " + table + " VALUES (" + data[i].id + ", '" + data[i].name + "')", function () {
					pending -= 1;

					if (pending === 0) {
						return cb();
					}
				});
			}
			break;
	}
};

common.insertModel2Data = function (table, db, data, cb) {
	var query = [], i;

	switch (this.protocol()) {
		case "postgres":
		case "redshift":
		case "mysql":
			query = [];

			for (i = 0; i < data.length; i++) {
				query.push(data[i].id + ", '" + data[i].name + "', " + data[i].assoc);
			}

			db.query("INSERT INTO " + table + " VALUES (" + query.join("), (") + ")", cb);
			break;
		case "sqlite":
			var pending = data.length;
			for (i = 0; i < data.length; i++) {
				db.run("INSERT INTO " + table + " VALUES (" + data[i].id + ", '" + data[i].name + "', " + data[i].assoc + ")", function () {
					pending -= 1;

					if (pending === 0) {
						return cb();
					}
				});
			}
			break;
	}
};

common.insertModelAssocUpDownData = function (table, db, data, cb) {
	var query = [], i;

	switch (this.protocol()) {
		case "postgres":
		case "redshift":
		case "mysql":
			query = [];

			for (i = 0; i < data.length; i++) {
				query.push(data[i].id + ", '" + data[i].name + "', " + data[i].assocup + ", " + data[i].assocdown);
			}

			db.query("INSERT INTO " + table + " VALUES (" + query.join("), (") + ")", cb);
			break;
		case "sqlite":
			var pending = data.length;
			for (i = 0; i < data.length; i++) {
				db.run("INSERT INTO " + table + " VALUES (" + data[i].id + ", '" + data[i].name + "', " + data[i].assocup + ", " + data[i].assocdown + ")", function () {
					pending -= 1;

					if (pending === 0) {
						return cb();
					}
				});
			}
			break;
	}
};

common.insertKeysModelData = function (table, db, data, cb) {
	var query = [], i, k, keys, vals, pending;

	for (i = 0; i < data.length; i++) {
		keys = [];
		vals = [];

		for (k in data[i]) {
			keys.push(k);
			vals.push(data[i][k]);
		}

		query.push("INSERT INTO " + table + " (" + keys.join(", ") + ") VALUES ('" + vals.join("', '") + "')");
	}

	pending = query.length;

	for (i = 0; i < query.length; i++) {
		switch (this.protocol()) {
			case "postgres":
			case "redshift":
			case "mysql":
				db.query(query[i], function () {
					if (--pending === 0) {
						return cb();
					}
				});
				break;
			case "sqlite":
				db.run(query[i], function () {
					if (--pending === 0) {
						return cb();
					}
				});
				break;
		}
	}
};

common.insertModelAssocData = function (table, db, data, cb) {
	var query = [], i;

	switch (this.protocol()) {
		case "postgres":
		case "redshift":
		case "mysql":
			query = [];

			for (i = 0; i < data.length; i++) {
				if (data[i].length < 3) {
					data[i].push(0);
				}
				query.push(data[i].join(", "));
			}

			db.query("INSERT INTO " + table + " VALUES (" + query.join("), (") + ")", cb);
			break;
		case "sqlite":
			var pending = data.length;
			for (i = 0; i < data.length; i++) {
				if (data[i].length < 3) {
					data[i].push(0);
				}
				db.run("INSERT INTO " + table + " VALUES (" + data[i].join(", ") + ")", function () {
					pending -= 1;

					if (pending === 0) {
						return cb();
					}
				});
			}
			break;
	}
};

common.dropSync = function (models, done) {
	if (!Array.isArray(models)) {
		models = [models];
	}

	async.eachSeries(models, function(item, cb) {
		item.drop(function(err) {
			if (err) throw err
			item.sync(function(err) {
				if (err) throw err
				cb();
			});
		});
	}, function() {
		done();
	});
};
