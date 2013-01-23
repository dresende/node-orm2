var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	var TestModel = db.define('test_drop', common.getModelProperties());

	TestModel.sync(function (err) {
		if (err !== null) {
			// not supported by all drivers
			return db.close();
		}

		TestModel.drop(function (err) {
			if (err !== null) {
				// not supported by all drivers
				return db.close();
			}

			db.close();
		});
	});
});
