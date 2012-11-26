var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_validation` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		var TestModel = db.define('test_validation', {}, {
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

			db.close();
		});
	});
});
