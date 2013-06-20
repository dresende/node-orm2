var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find', db.driver.db, function () {
		common.insertModelData('test_find', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find', common.getModelProperties());

			TestModel.find(function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances[0].id, 1);
				assert.equal(Instances[0].name, 'test1');
				assert.equal(Instances[1].id, 2);
				assert.equal(Instances[1].name, 'test2');
				db.close();
			});
		});
	});
});
