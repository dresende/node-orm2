var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_aggregate_distinct', db.driver.db, function () {
		common.insertModelData('test_aggregate_distinct', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test1' },
			{ id : 3, name : 'test2' },
			{ id : 4, name : 'test2' },
			{ id : 5, name : 'test2' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_aggregate_distinct', common.getModelProperties());

			TestModel.aggregate().distinct('name').get(function (err, names) {
				assert.equal(err, null);
				assert.equal(Array.isArray(names), true);
				assert.equal(names.length, 2);
				db.close();
			});
		});
	});
});
