var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_association_hasmany_get` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		db.driver.db.query([
			"CREATE TEMPORARY TABLE `test_association_hasmany_get_assocs` (",
			"`test_association_hasmany_get_id` INT (5) NOT NULL,",
			"`assocs_id` INT(5) NOT NULL",
			")"
		].join(""), function () {
			db.driver.db.query("INSERT INTO `test_association_hasmany_get` VALUES (1, 'test1'), (2, 'test2'), (3, 'test3')", function (err) {
				if (err) throw err;

				db.driver.db.query("INSERT INTO `test_association_hasmany_get_assocs` VALUES (1, 2), (1, 3)", function (err) {
					if (err) throw err;

					var TestModel = db.define('test_association_hasmany_get');
					TestModel.hasMany("assocs");

					TestModel.get(1, function (err, Test1) {
						assert.equal(err, null);
						Test1.getAssocs(function (err, Tests) {
							assert.equal(err, null);
							assert.equal(Array.isArray(Tests), true);
							assert.equal(Tests.length, 2);
							assert.equal(Tests[0].name, 'test2');
							assert.equal(Tests[1].name, 'test3');
							db.close();
						});
					});
				});
			});
		});
	});
});
