var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasmany_add_extra', db.driver.db, function () {
		common.createModelAssocTable('test_association_hasmany_add_extra', 'assocs', db.driver.db, function () {
			common.insertModelData('test_association_hasmany_add_extra', db.driver.db, [
				{ id : 1, name : 'test1' },
				{ id : 2, name : 'test2' },
				{ id : 3, name : 'test3' }
			], function (err) {
				if (err) throw err;

				var TestModel = db.define('test_association_hasmany_add_extra', common.getModelProperties());
				TestModel.hasMany("assocs", {
					extra_field: Number
				});

				TestModel.get(1, function (err, Test1) {
					assert.equal(err, null);
					TestModel.get(2, function (err, Test2) {
						assert.equal(err, null);
						Test1.addAssocs(Test2, { extra_field: 99 }, function (err) {
							assert.equal(err, null);
							Test1.getAssocs(function (err, Tests) {
								assert.equal(err, null);
								assert.equal(Array.isArray(Tests), true);
								assert.equal(Tests.length, 1);
								assert.equal(Tests[0].name, Test2.name);
								assert.equal(Tests[0].extra.extra_field, 99);
								db.close();
							});
						});
					});
				});
			});
		});
	});
});
