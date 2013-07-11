var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_get_singleton_nocache', db.driver.db, function () {
		common.insertModelData('test_get_singleton_nocache', db.driver.db, [
			{ id : 1, name : 'test' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_get_singleton_nocache', common.getModelProperties(), { cache: false });

			TestModel.get(1, function (err, Instance1) {
				assert.equal(err, null);
				TestModel.get(1, function (err, Instance2) {
					assert.equal(err, null);
					assert.notStrictEqual(Instance1, Instance2);
					db.close();
				});
			});
		});
	});
});
