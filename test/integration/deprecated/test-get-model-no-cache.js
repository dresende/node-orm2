var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_get_model_no_cache', db.driver.db, function () {
		common.insertModelData('test_get_model_no_cache', db.driver.db, [
			{ id : 1, name : 'test' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_get_model_no_cache', common.getModelProperties(), { cache: false });

			TestModel.get(1, function (err, Instance1) {
				assert.equal(err, null);
				assert.equal(typeof Instance1, "object");
				assert.equal(Instance1.id, 1);
				assert.equal(Instance1.name, 'test');

				Instance1.name = 'test1';

				TestModel.get(1, function (err, Instance2) {
					assert.equal(err, null);
					assert.equal(typeof Instance2, "object");
					assert.equal(Instance2.id, 1);
					assert.equal(Instance2.name, 'test');
					db.close();
				});
			});
		});
	});
});
