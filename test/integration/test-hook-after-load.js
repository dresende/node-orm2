var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_before_save', db.driver.db, function () {
		var calledAfterLoad = false;
		var TestModel = db.define('test_hook_before_save', common.getModelProperties(), {
			hooks: {
				afterLoad: function () {
					calledAfterLoad = true;

					db.close();
				}
			}
		});

		var Test = new TestModel({ name: "beforeSave" });
	});
});
