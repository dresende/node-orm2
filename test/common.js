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

common.hasConfig = function (proto) {
	var config;

	try {
		config = require("./config");
	} catch (ex) {
		return 'not-found';
	}

	return (config.hasOwnProperty(proto) ? 'found' : 'not-defined');
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
			case 'mongodb':
				return { host: "localhost", database: "test" };
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
			case 'mongodb':
				return 'mongodb://localhost/test';
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
			case 'mongodb':
				return 'mongodb://' +
				       (config.user || '') +
				       (config.password ? ':' + config.password : '') +
				       '@' + (config.host || 'localhost') +
				       '/' + (config.database || 'test');
			case 'sqlite':
				return 'sqlite://' + (config.pathname || "");
			default:
				throw new Error("Unknown protocol");
		}
	}
	return url;
};
