var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_after_create', db.driver.db, function () {
		var afterCreate = false;
		var TestModel = db.define('test_hook_after_create', common.getModelProperties(), {
			hooks: {
				afterCreate: function () {
					afterCreate = true;
				}
			}
		});

		var Test = new TestModel({ name: "afterCreate" });
		Test.save(function (err) {
			assert.equal(err, null);

			db.close(function () {
				assert.equal(afterCreate, true);
			});
		});
	});
});
