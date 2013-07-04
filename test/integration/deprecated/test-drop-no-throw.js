var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	var TestModel = db.define('test_drop', common.getModelProperties());

	TestModel.sync(function (err) {
		if (err !== null) {
			// not supported by all drivers
			return db.close();
		}

		assert.doesNotThrow(function () {
			TestModel.drop();
		});

		setTimeout(function () {
			db.close();
		}, 500);
	});
});
