var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasmany_find_autofetch', db.driver.db, function () {
		common.createModelAssocTable('test_association_hasmany_find_autofetch', 'assocs', db.driver.db, function () {
			common.insertModelData('test_association_hasmany_find_autofetch', db.driver.db, [
				{ id : 1, name : 'test1' },
				{ id : 2, name : 'test2' },
				{ id : 3, name : 'test3' },
				{ id : 4, name : 'test4' },
				{ id : 5, name : 'test5' }
			], function (err) {
				if (err) throw err;

				var TestModel = db.define('test_association_hasmany_find_autofetch', common.getModelProperties());
				TestModel.hasMany("assocs");

				TestModel.find(function (err, Tests) {
					assert.equal(err, null);

					var Test = Tests.splice(0, 1)[0];
					var total_assocs = Tests.length;

					Test.setAssocs(Tests, function (err) {
						assert.equal(err, null);

						TestModel.find({ id: Test.id }, { autoFetch: true, cache: false }, function (err, Tests1) {
							assert.equal(err, null);
							assert.equal(Array.isArray(Tests1), true);
							assert.equal(Tests1.length, 1);
							assert.equal(Tests1[0].id, Test.id);
							assert.equal(Tests1[0].id, Test.id);
							assert.equal(Array.isArray(Tests1[0].assocs), true);
							assert.equal(Tests1[0].assocs.length, total_assocs);
							db.close();
						});
					});
				});
			});
		});
	});
});
