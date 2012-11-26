var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_hook_for_single_property` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		db.driver.db.query("INSERT INTO `test_hook_for_single_property` VALUES (1, 'test')", function (err) {
			if (err) throw err;

			var calledBefore = false, calledAfter = false;
			var TestModel = db.define('test_hook_for_single_property', {}, {
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
