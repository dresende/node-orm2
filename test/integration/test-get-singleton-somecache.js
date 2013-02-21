var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_get_singleton_somecache', db.driver.db, function () {
		common.insertModelData('test_get_singleton_somecache', db.driver.db, [
			{ id : 1, name : 'test' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_get_singleton_somecache', common.getModelProperties(), { cache: 0.5 });

			TestModel.get(1, function (err, Instance1) {
				assert.equal(err, null);

				TestModel.get(1, function (err, Instance2) {
					assert.equal(err, null);
					assert.strictEqual(Instance1, Instance2);
				});

				setTimeout(function () {
					TestModel.get(1, function (err, Instance3) {
						assert.equal(err, null);
						assert.notStrictEqual(Instance1, Instance3);
						db.close();
					});
				}, 1000);
			});
		});
	});
});
