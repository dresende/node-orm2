var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_chain_first', db.driver.db, function () {
		common.insertModelData('test_find_chain_first', db.driver.db, [
			{ id : 1, name : 'test2' },
			{ id : 2, name : 'test1' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_chain_first', common.getModelProperties());

			TestModel.find().order("name").first(function (err, Instance) {
				assert.equal(err, null);
				assert.equal(Instance.id, 2);
				assert.equal(Instance.name, "test1");
				db.close();
			});
		});
	});
});
