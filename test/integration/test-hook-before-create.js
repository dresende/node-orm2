var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_before_create', db.driver.db, function () {
		var beforeCreate = false;
		var TestModel = db.define('test_hook_before_create', common.getModelProperties(), {
			hooks: {
				beforeCreate: function () {
					beforeCreate = true;
				}
			}
		});

		var Test = new TestModel({ name: "beforeCreate" });
		Test.save(function (err) {
			assert.equal(err, null);

			db.close(function () {
				assert.equal(beforeCreate, true);
			});
		});
	});
});
