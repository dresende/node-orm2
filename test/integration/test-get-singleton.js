var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_get_singleton', db.driver.db, function () {
		db.driver.db.query("INSERT INTO test_get_singleton VALUES (1, 'test')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_get_singleton', common.getModelProperties());

			TestModel.get(1, function (err, Instance1) {
				assert.equal(err, null);
				TestModel.get(1, function (err, Instance2) {
					assert.equal(err, null);
					assert.strictEqual(Instance1, Instance2);
					db.close();
				});
			});
		});
	});
});
