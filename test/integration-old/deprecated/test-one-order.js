var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_one_order', db.driver.db, function () {
		common.insertModelData('test_one_order', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test3' },
			{ id : 4, name : 'test4' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_one_order', common.getModelProperties());

			TestModel.one("-name", function (err, Instance) {
				assert.equal(err, null);
				assert.equal(!Array.isArray(Instance), true);
				assert.equal(Instance.id, 4);
				db.close();
			});
		});
	});
});
