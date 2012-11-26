var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_find_order` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		db.driver.db.query("INSERT INTO `test_find_order` VALUES (1, 'test2'), (2, 'test1')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_order');

			TestModel.find("name", function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 2);
				assert.equal(Instances[0].id, 2);
				assert.equal(Instances[1].id, 1);
				db.close();
			});
		});
	});
});
