var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_aggregate_groupby_orderby', db.driver.db, function () {
		common.insertModelData('test_aggregate_groupby_orderby', db.driver.db, [
			{ id : 2, name : 'test1' },
			{ id : 3, name : 'test1' },
			{ id : 4, name : 'test1' },
			{ id : 5, name : 'test2' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_aggregate_groupby_orderby', common.getModelProperties());

			TestModel.aggregate().avg('id').count().groupBy('name').order('name', 'Z').get(function (err, rows) {
				assert.equal(err, null);
				assert.equal(Array.isArray(rows), true);
				assert.equal(rows.length, 2);
				assert.equal(rows[0].avg_id, 5);
				assert.equal(rows[0].count, 1);
				assert.equal(rows[1].avg_id, 3);
				assert.equal(rows[1].count, 3);
				db.close();
			});
		});
	});
});
