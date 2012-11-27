var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_get', db.driver.db, function () {
		db.driver.db.query("INSERT INTO test_get VALUES (1, 'test')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_get');

			TestModel.get(1, function (err, Instance) {
				assert.equal(err, null);
				assert.equal(typeof Instance, "object");
				assert.equal(Instance.id, 1);
				assert.equal(Instance.name, 'test');
				db.close();
			});
		});
	});
});
