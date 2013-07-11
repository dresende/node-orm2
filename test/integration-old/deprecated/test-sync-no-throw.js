var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	var TestModel = db.define('test_sync', common.getModelProperties());

	assert.doesNotThrow(function () {
		TestModel.sync();
	});

	setTimeout(function () {
		db.close();
	}, 500);
});
