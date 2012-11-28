var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_after_save', db.driver.db, function () {
		var calledAfter = false;
		var TestModel = db.define('test_hook_after_save', common.getModelProperties(), {
			hooks: {
				afterSave: function () {
					calledAfter = true;
				}
			}
		});

		var Test = new TestModel({ name: "beforeSave" });
		Test.save(function (err) {
			assert.equal(err, null);

			db.close(function () {
				assert.equal(calledAfter, true);
			});
		});
	});
});
