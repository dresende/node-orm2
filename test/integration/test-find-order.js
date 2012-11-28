var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_order', db.driver.db, function () {
		db.driver.db.query("INSERT INTO test_find_order VALUES (1, 'test2'), (2, 'test1')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_order', common.getModelProperties());

			TestModel.find("name", function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 2);
				assert.equal(Instances[0].id, 2);
				assert.equal(Instances[1].id, 1);
				db.close();
			});
		});
	});
});
