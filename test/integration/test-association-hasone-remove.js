var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModel2Table('test_association_hasone_remove', db.driver.db, function () {
		db.driver.db.query("INSERT INTO test_association_hasone_remove VALUES (1, 'test1', 2), (2, 'test2', 0)", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_association_hasone_remove');
			TestModel.hasOne("assoc");

			TestModel.get(1, function (err, Test1) {
				assert.equal(err, null);
				Test1.removeAssoc(function (err) {
					console.log(err);
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
