var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_get` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		db.driver.db.query("INSERT INTO `test_get` VALUES (1, 'test')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_get');

			TestModel.get(1, function (err, Instance) {
				assert.equal(err, null);
				assert.equal(typeof Instance, "object");
				assert.equal(Instance.id, 1);
				assert.equal(Instance.name, 'test');
				db.close();
			});
		});
	});
});
