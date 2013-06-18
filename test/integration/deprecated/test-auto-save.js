var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_auto_save', db.driver.db, function () {
		common.insertModelData('test_auto_save', db.driver.db, [
			{ id : 1, name : 'test' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_auto_save', common.getModelProperties(), {
				autoSave: true
			});
			var autoSaved = false;

			TestModel.get(1, function (err, Test) {
				Test.on("save", function () {
					console.log("now saving!");
					autoSaved = true;
				});
				Test.name = "auto-save test";

				setTimeout(function () {
					db.close(function () {
						assert.equal(autoSaved, true, "event 'save' not triggered");
					});
				}, 1000);
			});
		});
	});
});
