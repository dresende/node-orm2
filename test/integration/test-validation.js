var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_validation', db.driver.db, function () {
		var TestModel = db.define('test_validation', common.getModelProperties(), {
			validations: {
				name: function (name, next) {
					return next('force-validation-fail');
				}
			}
		});

		var Test = new TestModel({ name: "test-validation" });
		Test.save(function (err) {
			assert.equal(typeof err, "object");
			assert.equal(err.field, "name");
			assert.equal(err.value, "test-validation");
			assert.equal(err.msg, "force-validation-fail");

			Test = new TestModel({ name: "test-validation" });
			Test.validate(function (err) {
				assert.equal(typeof err, "object");
				assert.equal(err.field, "name");
				assert.equal(err.value, "test-validation");
				assert.equal(err.msg, "force-validation-fail");

				db.close();
			});
		});
	});
});
