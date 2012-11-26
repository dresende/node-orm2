var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_auto_save` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		db.driver.db.query("INSERT INTO `test_auto_save` VALUES (1, 'test')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_auto_save', {}, {
				autoSave: true
			});
			var autoSaved = false;

			TestModel.get(1, function (err, Test) {
				Test.on("save", function () {
					autoSaved = true;
				});
				Test.name = "auto-save test";

				db.close(function () {
					assert.equal(autoSaved, true);
				});
			});
		});
	});
});
