var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_hook_after_save` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		var calledAfter = false;
		var TestModel = db.define('test_hook_after_save', {}, {
			hooks: {
				afterSave: function () {
					calledAfter = true;
				}
			}
		});

		var Test = new TestModel({ name: "beforeSave" });
		Test.save(function (err) {
			assert.equal(err, null);

			db.close(function () {
				assert.equal(calledAfter, true);
			});
		});
	});
});
