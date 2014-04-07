var common = require('../common');
var async  = require('async');
var should = require('should');

module.exports.connect = function(cb) {
	var opts = {};

	if (1 in arguments) {
		opts = arguments[0];
		cb   = arguments[1];
	}
	common.createConnection(opts, function (err, conn) {
		if (err) throw err;
		cb(conn);
	});
};

module.exports.dropSync = function (models, done) {
	if (!Array.isArray(models)) {
		models = [models];
	}

	async.eachSeries(models, function (item, cb) {
		item.drop(function (err) {
			if (err) throw err;

			item.sync(cb);
		});
	}, function (err) {
		if (common.protocol() != 'sqlite') {
			if (err) throw err;
		}
		done(err);
	});
};
