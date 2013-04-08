var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_predefined_validation', db.driver.db, function () {
		var TestModel = db.define('test_predefined_validation', common.getModelProperties(), {
			validations: {
				name: db.validators.rangeLength(2, 3)
			}
		});

		var Test = new TestModel({ name: "test-predefined-validation" });
		Test.save(function (err) {
			assert.equal(typeof err, "object");
			assert.equal(err.field, "name");
			assert.equal(err.value, "test-predefined-validation");
			assert.equal(err.msg, "out-of-range-length");
			assert.equal(err.type, "validation");

			db.close();
		});
	});
});
