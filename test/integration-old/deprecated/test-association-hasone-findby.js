var common     = require('../common');
var assert     = require('assert');

// yes, this test is confusing, it's because .findBy*() currently only works on different tables,
// you cannot have a relationship to the same table (because of sql-query table alias restriction)
common.createConnection(function (err, db) {
	common.createModel2Table('test_association_hasone_findby', db.driver.db, function () {
		common.insertModel2Data('test_association_hasone_findby', db.driver.db, [
			{ id : 1, name : 'test1', assoc: 3 },
			{ id : 2, name : 'test2', assoc: 0 }
		], function (err) {
			common.createModelTable('test_association_hasone_findby2', db.driver.db, function () {
				common.insertModelData('test_association_hasone_findby2', db.driver.db, [
					{ id : 3, name : 'test3' },
					{ id : 4, name : 'test4' }
				], function (err) {
					if (err) throw err;

					var TestModel2 = db.define('test_association_hasone_findby2', common.getModelProperties());
					var TestModel = db.define('test_association_hasone_findby', common.getModelProperties());
					TestModel.hasOne("assoc", TestModel2);

					TestModel.findByAssoc({ name: "test3" }).find({ name: "test1" }, function (err, Tests) {
						assert.equal(err, null);
						assert.equal(Array.isArray(Tests), true);
						assert.equal(Tests.length, 1);
						assert.equal(typeof Tests[0], "object");
						assert.equal(Tests[0].id, 1);
						db.close();
					});
				});
			});
		});
	});
});
