var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_after_remove', db.driver.db, function () {
		common.insertModelData('test_hook_after_remove', db.driver.db, [
			{ id : 1, name : 'test' }
		], function (err) {
			var afterRemove = false;
			var TestModel = db.define('test_hook_after_remove', common.getModelProperties(), {
				hooks: {
					afterRemove: function () {
						afterRemove = true;
					}
				}
			});

			TestModel.get(1, function (err, Instance) {
				assert.equal(err, null);
				Instance.remove(function (err) {
					assert.equal(err, null);
					assert.equal(afterRemove, true);

					db.close();
				});
			});
		});
	});
});
