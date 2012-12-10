var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_no_cache', db.driver.db, function () {
		common.insertModelData('test_find_no_cache', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test3' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_no_cache', common.getModelProperties());

			TestModel.find({ name: 'test3' }, { cache: false }, function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 1);
				assert.equal(Instances[0].id, 3);
				assert.equal(Instances[0].name, 'test3');

				Instances[0].name = 'test-no-cache';

				TestModel.find({ name: 'test3' }, { cache: false }, function (err, Instances) {
					assert.equal(err, null);
					assert.equal(Array.isArray(Instances), true);
					assert.equal(Instances.length, 1);
					assert.equal(Instances[0].id, 3);
					assert.equal(Instances[0].name, 'test3');
					db.close();
				});
			});
		});
	});
});
