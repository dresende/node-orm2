var common = exports;
var path   = require('path');
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

common.getConnectionString = function () {
	var url;

	if (common.isTravis()) {
		if (this.protocol() == 'mysql') {
			url = 'mysql://root@localhost/orm_test';
		} else {
			url = 'postgres://postgres@localhost/orm_test';
		}
	} else {
		var config = require("./config")[this.protocol()];
		if (this.protocol() == 'mysql') {
			url = 'mysql://' +
			      (config.user || 'root') +
			      (config.password ? ':' + config.password : '') +
			      '@' + (config.host || 'localhost') +
			      '/' + (config.database || 'orm_test');
		} else {
			url = 'postgres://' +
			      (config.user || 'postgres') +
			      (config.password ? ':' + config.password : '') +
			      '@' + (config.host || 'localhost') +
			      '/' + (config.database || 'orm_test');
		}
	}
	return url;
};

common.createModelTable = function (table, db, cb) {
	switch (this.protocol()) {
		case "postgres":
			db.query("CREATE TEMPORARY TABLE " + table + " (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL)", cb);
			break;
		default:
			db.query("CREATE TEMPORARY TABLE " + table + " (id BIGINT NOT NULL PRIMARY KEY, name VARCHAR(100) NOT NULL)", cb);
			break;
	}
};

common.createModel2Table = function (table, db, cb) {
	switch (this.protocol()) {
		case "postgres":
			db.query("CREATE TEMPORARY TABLE " + table + " (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, assoc_id BIGINT NOT NULL)", cb);
			break;
		default:
			db.query("CREATE TEMPORARY TABLE " + table + " (id BIGINT NOT NULL PRIMARY KEY, name VARCHAR(100) NOT NULL, assoc_id BIGINT NOT NULL)", cb);
			break;
	}
};

common.createModelAssocTable = function (table, assoc, db, cb) {
	switch (this.protocol()) {
		case "postgres":
			db.query("CREATE TEMPORARY TABLE " + table + "_" + assoc + " (" + table + "_id BIGINT NOT NULL, " + assoc + "_id BIGINT NOT NULL)", cb);
			break;
		default:
			db.query("CREATE TEMPORARY TABLE " + table + "_" + assoc + " (" + table + "_id BIGINT NOT NULL, " + assoc + "_id BIGINT NOT NULL)", cb);
			break;
	}
};
