var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_find_limit` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		db.driver.db.query("INSERT INTO `test_find_limit` VALUES (1, 'test1'), (2, 'test2')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_limit');

			TestModel.find(1, function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 1);
				db.close();
			});
		});
	});
});
