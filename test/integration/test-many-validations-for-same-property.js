var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_predefined_validation', db.driver.db, function () {
		var TestModel = db.define('test_predefined_validation', common.getModelProperties(), {
			validations: {
				name: [
					db.validators.rangeLength(0, 20, 'error1'), // should not fail on this one
					db.validators.rangeLength(2, 3, 'error2')   // should fail on this one
				]
			}
		});

		var Test = new TestModel({ name: "test-validation" });
		Test.save(function (err) {
			assert.equal(typeof err, "object");
			assert.equal(err.field, "name");
			assert.equal(err.value, "test-validation");
			assert.equal(err.msg, "error2");

			db.close();
		});
	});
});
