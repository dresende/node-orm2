var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_before_save_wait', db.driver.db, function () {
		var calledBefore = false;
		var TestModel = db.define('test_hook_before_save_wait', common.getModelProperties(), {
			hooks: {
				beforeSave: function (next) {
					return setTimeout(function () {
						calledBefore = true;

						return next();
					}, 1000);
				}
			}
		});

		var Test = new TestModel({ name: "beforeSave" });
		Test.save(function (err) {
			assert.equal(err, null);

			db.close(function () {
				assert.equal(calledBefore, true);
			});
		});
	});
});
