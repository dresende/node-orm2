var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_before_validation', db.driver.db, function () {
		var beforeValidation = false;
		var TestModel = db.define('test_hook_before_validation', common.getModelProperties(), {
			hooks: {
				beforeValidation: function () {
					beforeValidation = true;
				}
			}
		});

		var Test = new TestModel({ name: "beforeValidation" });
		Test.save(function (err) {
			assert.equal(err, null);

			db.close(function () {
				assert.equal(beforeValidation, true);
			});
		});
	});
});
