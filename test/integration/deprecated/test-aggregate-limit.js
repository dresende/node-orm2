var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_aggregate_limit', db.driver.db, function () {
		common.insertModelData('test_aggregate_limit', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test1' },
			{ id : 3, name : 'test2' },
			{ id : 4, name : 'test2' },
			{ id : 5, name : 'test2' },
			{ id : 6, name : 'test3' },
			{ id : 7, name : 'test3' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_aggregate_limit', common.getModelProperties());

			TestModel.aggregate().distinct('name').limit(1).get(function (err, names) {
				assert.equal(err, null);
				assert.equal(Array.isArray(names), true);
				assert.equal(names.length, 1);
				db.close();
			});
		});
	});
});
