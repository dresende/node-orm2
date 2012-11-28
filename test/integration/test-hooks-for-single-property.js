var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_for_single_property', db.driver.db, function () {
		db.driver.db.query("INSERT INTO test_hook_for_single_property VALUES (1, 'test')", function (err) {
			if (err) throw err;

			var calledBefore = false, calledAfter = false;
			var TestModel = db.define('test_hook_for_single_property', common.getModelProperties(), {
				autoSave: true,
				hooks: {
					beforeSave: function () {
						calledBefore = true;
					},
					afterSave: function () {
						calledAfter = true;
					}
				}
			});

			TestModel.get(1, function (err, Test) {
				Test.name = "test_hook_for_single_property";

				db.close(function () {
					assert.equal(calledBefore, true);
					assert.equal(calledAfter, true);
				});
			});
		});
	});
});
