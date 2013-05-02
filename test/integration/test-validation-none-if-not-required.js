var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_validation_none_if_not_required', db.driver.db, function () {
		var calledValidation = false;
		var TestModel = db.define('test_validation_none_if_not_required', {
			name : { type: "text", required: false }
		}, {
			validations: {
				name: function (name, next) {
					calledValidation = true;
					return next();
				}
			}
		});

		var Test = new TestModel();
		Test.save(function (err) {
			// it doesn't matter the error..
			assert.equal(calledValidation, false);

			db.close();
		});
	});
});
