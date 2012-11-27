var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.driver.db.query([
		"CREATE TEMPORARY TABLE `test_association_hasmany_set` (",
		"`id` INT (5) NOT NULL PRIMARY KEY AUTO_INCREMENT,",
		"`name` VARCHAR(100) NOT NULL",
		")"
	].join(""), function () {
		db.driver.db.query([
			"CREATE TEMPORARY TABLE `test_association_hasmany_set_assocs` (",
			"`test_association_hasmany_set_id` INT (5) NOT NULL,",
			"`assocs_id` INT(5) NOT NULL",
			")"
		].join(""), function () {
			db.driver.db.query("INSERT INTO `test_association_hasmany_set` VALUES (1, 'test1'), (2, 'test2'), (3, 'test3')", function (err) {
				if (err) throw err;

				var TestModel = db.define('test_association_hasmany_set');
				TestModel.hasMany("assocs");

				TestModel.get(1, function (err, Test1) {
					assert.equal(err, null);
					TestModel.get(2, function (err, Test2) {
						assert.equal(err, null);
						Test1.setAssocs(Test2, function (err) {
							assert.equal(err, null);
							Test1.getAssocs(function (err, Tests) {
								assert.equal(err, null);
								assert.equal(Array.isArray(Tests), true);
								assert.equal(Tests.length, 1);
								assert.equal(Tests[0].name, Test2.name);
								db.close();
							});
						});
					});
				});
			});
		});
	});
});
