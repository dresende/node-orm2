var common     = require('../common');
var assert     = require('assert');
var tableName  = 'test_find_where';

common.createConnection(function (err, db) {
	common.createModelTable(tableName, db.driver.db, function () {
		common.insertModelData(tableName, db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define(tableName, common.getModelProperties());

			TestModel.find({ name: common.ORM.like("test_") }, function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 2);
				db.close();
			});
		});
	});
});
