var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasmany_add_array', db.driver.db, function () {
		common.createModelAssocTable('test_association_hasmany_add_array', 'assocs', db.driver.db, function () {
			common.insertModelData('test_association_hasmany_add_array', db.driver.db, [
				{ id : 1, name : 'test1' },
				{ id : 2, name : 'test2' },
				{ id : 3, name : 'test3' }
			], function (err) {
				if (err) throw err;

				var TestModel = db.define('test_association_hasmany_add_array', common.getModelProperties());
				TestModel.hasMany("assocs");

				TestModel.get(1, function (err, Test1) {
					assert.equal(err, null);
					TestModel.get(2, function (err, Test2) {
						assert.equal(err, null);
						TestModel.get(3, function (err, Test3) {
							assert.equal(err, null);
							Test1.addAssocs(Test2, [ Test3 ], function (err) {
								assert.equal(err, null);
								Test1.getAssocs(function (err, Tests) {
									assert.equal(err, null);
									assert.equal(Array.isArray(Tests), true);
									assert.equal(Tests.length, 2);
									if (Tests[0].id == Test2.id) {
										assert.equal(Tests[0].name, Test2.name);
										assert.equal(Tests[1].name, Test3.name);
									} else {
										assert.equal(Tests[0].name, Test3.name);
										assert.equal(Tests[1].name, Test2.name);
									}
									db.close();
								});
							});
						});
					});
				});
			});
		});
	});
});
