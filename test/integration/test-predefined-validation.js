var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_predefined_validation` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
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

			db.close();
		});
	});
});
