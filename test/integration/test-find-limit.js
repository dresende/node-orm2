var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_limit', db.driver.db, function () {
		db.driver.db.query("INSERT INTO test_find_limit VALUES (1, 'test1'), (2, 'test2')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_limit', common.getModelProperties());

			TestModel.find(1, function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 1);
				db.close();
			});
		});
	});
});
