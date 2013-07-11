var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_before_validation_wait', db.driver.db, function () {
		var beforeValidation = false;
		var TestModel = db.define('test_hook_before_validation_wait', common.getModelProperties(), {
			hooks: {
				beforeValidation: function (next) {
					beforeValidation = true;

					setTimeout(function () {
						return next(new Error("Validation failed"));
					}, 1000);
				}
			}
		});

		var Test = new TestModel({ name: "beforeValidation" });
		Test.save(function (err) {
			assert.equal(err.message, "Validation failed");

			db.close(function () {
				assert.equal(beforeValidation, true);
			});
		});
	});
});
