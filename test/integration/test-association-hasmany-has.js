var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasmany_has', db.driver.db, function () {
		common.createModelAssocTable('test_association_hasmany_has', 'assocs', db.driver.db, function () {
			common.insertModelData('test_association_hasmany_has', db.driver.db, [
				{ id : 1, name : 'test1' },
				{ id : 2, name : 'test2' },
				{ id : 3, name : 'test3' },
				{ id : 4, name : 'test4' }
			], function (err) {
				if (err) throw err;

				common.insertModelAssocData('test_association_hasmany_has_assocs', db.driver.db, [
					[ 1, 2 ],
					[ 1, 3 ]
				], function (err) {
					if (err) throw err;

					var TestModel = db.define('test_association_hasmany_has', common.getModelProperties());
					TestModel.hasMany("assocs");

					TestModel.get(1, function (err, Test1) {
						assert.equal(err, null);

						TestModel.get(2, function (err, Test2) {
							assert.equal(err, null);

							TestModel.get(3, function (err, Test3) {
								assert.equal(err, null);

								TestModel.get(4, function (err, Test4) {
									assert.equal(err, null);

									Test1.hasAssocs(Test2, Test3, function (err, has23) {
										assert.equal(err, null);
										assert.equal(has23, true);

										Test1.hasAssocs(Test2, Test4, function (err, has24) {
											assert.equal(err, null);
											assert.equal(has24, false);

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
	});
});
