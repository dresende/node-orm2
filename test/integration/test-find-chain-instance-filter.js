var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_chain_instance_filter', db.driver.db, function () {
		common.insertModelData('test_find_chain_instance_filter', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test3' },
			{ id : 3, name : 'test4' },
			{ id : 4, name : 'test2' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_chain_instance_filter', common.getModelProperties());

			TestModel.find().each().filter(function (instance) {
				return instance.name.match(/test[24]/);
			}).sort(function (inst1, inst2) {
				return inst1.id < inst2.id;
			}).get(function (instances) {
				assert.equal(instances.length, 2);
				assert.equal(instances[0].id, 4);
				assert.equal(instances[1].id, 3);
				db.close();
			});
		});
	});
});
