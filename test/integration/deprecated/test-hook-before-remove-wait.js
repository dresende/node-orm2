var common     = require('../common');
var assert     = require('assert');
var util       = require('util');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_before_remove_halt', db.driver.db, function () {
		common.insertModelData('test_hook_before_remove_halt', db.driver.db, [
			{ id : 1, name : 'test' }
		], function (err) {
			var beforeRemove = false;
			var TestModel = db.define('test_hook_before_remove_halt', common.getModelProperties(), {
				hooks: {
					beforeRemove: function (next) {
						beforeRemove = true;
						setTimeout(function () {
							return next(new Error("Remove denied"));
						}, 1000);
					}
				}
			});

			TestModel.get(1, function (err, Instance) {
				assert.equal(err, null);
				Instance.remove(function (err) {
					assert.equal(beforeRemove, true);
					assert.equal(util.isError(err), true);
					assert.equal(err.message, "Remove denied");

					db.close();
				});
			});
		});
	});
});
