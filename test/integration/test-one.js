var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_one', db.driver.db, function () {
		common.insertModelData('test_one', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_one', common.getModelProperties());

			TestModel.one(function (err, Instance) {
				assert.equal(err, null);
				assert.equal(!Array.isArray(Instance), true);
				assert.equal(typeof Instance.id, "number");
				db.close();
			});
		});
	});
});
