var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_chain_instance_get', db.driver.db, function () {
		common.insertModelData('test_find_chain_instance_get', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test3' },
			{ id : 4, name : 'test4' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_chain_instance_get', common.getModelProperties());

			TestModel.find().each().forEach(function (instance) {
				instance.name = instance.id;
			}).get(function (instances) {
				assert.equal(instances.length, 4);
				assert.equal(instances[0].name, 1);
				assert.equal(instances[1].name, 2);
				assert.equal(instances[2].name, 3);
				assert.equal(instances[3].name, 4);
				db.close();
			});
		});
	});
});
