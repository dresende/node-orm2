var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_clear', db.driver.db, function () {
		db.driver.db.query("INSERT INTO test_clear VALUES (1, 'test'), (2, 'test')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_clear', common.getModelProperties());

			TestModel.find(function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 2);

				TestModel.clear(function (err) {
					assert.equal(err, null);

					TestModel.find(function (err, Instances) {
						assert.equal(err, null);
						assert.equal(Array.isArray(Instances), true);
						assert.equal(Instances.length, 0);

						db.close();
					});
				});
			});
		});
	});
});
