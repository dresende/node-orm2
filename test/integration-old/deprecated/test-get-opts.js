var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_get_opts', db.driver.db, function () {
		common.insertModelData('test_get_opts', db.driver.db, [
			{ id : 1, name : 'test' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_get_opts', common.getModelProperties());

			TestModel.get(1, {}, function (err, Instance) {
				assert.equal(err, null);
				assert.equal(typeof Instance, "object");
				assert.equal(Instance.id, 1);
				assert.equal(Instance.name, 'test');
				db.close();
			});
		});
	});
});
