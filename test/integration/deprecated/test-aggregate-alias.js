var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_aggregate', db.driver.db, function () {
		common.insertModelData('test_aggregate', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test3' },
			{ id : 4, name : 'test4' },
			{ id : 5, name : 'test5' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_aggregate', common.getModelProperties());

			TestModel.aggregate({ id: common.ORM.gt(2) }).count('id').as('alias').get(function (err, alias) {
				assert.equal(err, null);
				assert.equal(alias, 3);
				db.close();
			});
		});
	});
});
