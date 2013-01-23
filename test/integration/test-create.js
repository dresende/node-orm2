var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_create', db.driver.db, function () {
		var TestModel = db.define('test_create', common.getModelProperties());

		TestModel.create([
			{ name: 'test1' },
			{ name: 'test2' },
			{ name: 'test3' }
		], function (err) {
			TestModel.count(function (err, count) {
				assert.equal(err, null);
				assert.equal(count, 3);
				db.close();
			});
		});
	});
});
