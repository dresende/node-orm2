var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasmany_remove', db.driver.db, function () {
		common.createModelAssocTable('test_association_hasmany_remove', 'assocs', db.driver.db, function () {
			common.insertModelData('test_association_hasmany_remove', db.driver.db, [
				{ id : 1, name : 'test1' },
				{ id : 2, name : 'test2' },
				{ id : 3, name : 'test3' }
			], function (err) {
				if (err) throw err;

				common.insertModelAssocData('test_association_hasmany_remove_assocs', db.driver.db, [
					[ 1, 2 ],
					[ 1, 3 ]
				], function (err) {
					if (err) throw err;

					var TestModel = db.define('test_association_hasmany_remove', common.getModelProperties());
					TestModel.hasMany("assocs");

					TestModel.get(1, function (err, Test1) {
						assert.equal(err, null);
						Test1.getAssocs(function (err, Tests) {
							assert.equal(err, null);
							assert.equal(Array.isArray(Tests), true);
							assert.equal(Tests.length, 2);
							if (Tests[0].id == 2) {
								assert.equal(Tests[0].name, 'test2');
								assert.equal(Tests[1].name, 'test3');
							} else {
								assert.equal(Tests[0].name, 'test3');
								assert.equal(Tests[1].name, 'test2');
							}

							Test1.removeAssocs(function (err) {
								assert.equal(err, null);

								Test1.getAssocs(function (err, Tests) {
									assert.equal(err, null);
									assert.equal(Array.isArray(Tests), true);
									assert.equal(Tests.length, 0);
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
