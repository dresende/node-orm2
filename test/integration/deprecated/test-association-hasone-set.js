var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModel2Table('test_association_hasone_set', db.driver.db, function () {
		common.insertModel2Data('test_association_hasone_set', db.driver.db, [
			{ id : 1, name : 'test1', assoc: 0 },
			{ id : 2, name : 'test2', assoc: 0 }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_association_hasone_set', common.getModelProperties());
			TestModel.hasOne("assoc");

			TestModel.get(1, function (err, Test1) {
				assert.equal(err, null);
				TestModel.get(2, function (err, Test2) {
					assert.equal(err, null);
					Test1.setAssoc(Test2, function (err) {
						assert.equal(err, null);
						Test1.getAssoc(function (err, Test2) {
							assert.equal(err, null);
							assert.equal(typeof Test2, "object");
							assert.equal(Test2.id, 2);
							db.close();
						});
					});
				});
			});
		});
	});
});
