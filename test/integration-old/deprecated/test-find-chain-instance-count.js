var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_chain_instance_count', db.driver.db, function () {
		common.insertModelData('test_find_chain_instance_count', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test3' },
			{ id : 4, name : 'test4' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_chain_instance_count', common.getModelProperties());

			TestModel.find().each().filter(function (instance) {
				return (instance.id > 2);
			}).count(function (count) {
				assert.equal(count, 2);
				db.close();
			});
		});
	});
});
