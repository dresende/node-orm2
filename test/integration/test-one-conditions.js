var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_one_conditions', db.driver.db, function () {
		common.insertModelData('test_one_conditions', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test1' },
			{ id : 3, name : 'test1' },
			{ id : 4, name : 'test1' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_one_conditions', common.getModelProperties());

			TestModel.one({ name: 'test1' }, function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 1);
				db.close();
			});
		});
	});
});
