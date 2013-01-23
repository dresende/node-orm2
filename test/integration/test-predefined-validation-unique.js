var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_predefined_validation_unique', db.driver.db, function () {
		var TestModel = db.define('test_predefined_validation_unique', common.getModelProperties(), {
			validations: {
				name: db.validators.unique()
			}
		});

		var Test1 = new TestModel({ name: "test-predefined-validation-unique" });
		Test1.save(function (err) {
			assert.equal(err, null);

			var Test2 = new TestModel({ name: "test-predefined-validation-unique" });
			Test2.save(function (err) {
				assert.equal(typeof err, "object");
				assert.equal(err.field, "name");
				assert.equal(err.value, "test-predefined-validation-unique");
				assert.equal(err.msg, "not-unique");

				db.close();
			});
		});
	});
});
