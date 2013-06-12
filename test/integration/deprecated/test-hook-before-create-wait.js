var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_before_create_wait', db.driver.db, function () {
		var beforeCreate = false;
		var TestModel = db.define('test_hook_before_create_wait', common.getModelProperties(), {
			hooks: {
				beforeCreate: function (next) {
					return setTimeout(function () {
						beforeCreate = true;

						return next();
					}, 1000);
				}
			}
		});

		var Test = new TestModel({ name: "beforeCreate" });
		Test.save(function (err) {
			assert.equal(err, null);

			db.close(function () {
				assert.equal(beforeCreate, true);
			});
		});
	});
});
