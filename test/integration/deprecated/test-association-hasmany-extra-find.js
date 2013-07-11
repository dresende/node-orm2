var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasmany_extra', db.driver.db, function () {
		common.createModelAssocTable('test_association_hasmany_extra', 'assocs', db.driver.db, function () {
			common.insertModelData('test_association_hasmany_extra', db.driver.db, [
				{ id : 1, name : 'test1' },
				{ id : 2, name : 'test2' },
				{ id : 3, name : 'test3' }
			], function (err) {
				if (err) throw err;

				common.insertModelAssocData('test_association_hasmany_extra_assocs', db.driver.db, [
					[ 1, 2, 4 ],
					[ 1, 3, 5 ]
				], function (err) {
					if (err) throw err;

					var TestModel = db.define('test_association_hasmany_extra', common.getModelProperties());
					TestModel.hasMany("assocs", {
						extra_field: Number
					});

					TestModel.get(1, function (err, Test1) {
						assert.equal(err, null);

						Test1.getAssocs({ extra_field: 5}, function (err, Tests) {
							assert.equal(err, null);
							assert.equal(Array.isArray(Tests), true);
							assert.equal(Tests.length, 1);
							assert.equal(Tests[0].name, 'test3');
							assert.equal(Tests[0].extra.extra_field, 5);
							db.close();
						});
					});
				});
			});
		});
	});
});
