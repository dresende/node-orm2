var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasmany_set_array', db.driver.db, function () {
		common.createModelAssocTable('test_association_hasmany_set_array', 'assocs', db.driver.db, function () {
			common.insertModelData('test_association_hasmany_set_array', db.driver.db, [
				{ id : 1, name : 'test1' },
				{ id : 2, name : 'test2' },
				{ id : 3, name : 'test3' }
			], function (err) {
				if (err) throw err;

				common.insertModelAssocData('test_association_hasmany_set_array_assocs', db.driver.db, [
					[ 1, 2 ]
				], function (err) {
					var TestModel = db.define('test_association_hasmany_set_array', common.getModelProperties());
					TestModel.hasMany("assocs");

					TestModel.get(1, function (err, Test1) {
						assert.equal(err, null);
						TestModel.get(2, function (err, Test2) {
							assert.equal(err, null);
							Test1.setAssocs([ Test2 ], function (err) {
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
});
