var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_association_hasone_set` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL,",
		"`assoc_id` INT(5) NOT NULL",
		")"
	].join(""), function () {
		db.driver.db.query("INSERT INTO `test_association_hasone_set` VALUES (1, 'test1', 2), (2, 'test2', 0)", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_association_hasone_set');
			TestModel.hasOne("assoc");

			TestModel.get(1, function (err, Test1) {
				assert.equal(err, null);
				Test1.removeAssoc(function (err) {
					assert.equal(err, null);

					Test1.getAssoc(function (err, Test) {
						assert.equal(err, null);
						assert.equal(typeof Test, "undefined");
						db.close();
					});
				});
			});
		});
	});
});
