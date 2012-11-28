var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_auto_save', db.driver.db, function () {
		db.driver.db.query("INSERT INTO test_auto_save VALUES (1, 'test')", function (err) {
			if (err) throw err;

			var TestModel = db.define('test_auto_save', common.getModelProperties(), {
				autoSave: true
			});
			var autoSaved = false;

			TestModel.get(1, function (err, Test) {
				Test.on("save", function () {
					autoSaved = true;
				});
				Test.name = "auto-save test";

				db.close(function () {
					assert.equal(autoSaved, true);
				});
			});
		});
	});
});
