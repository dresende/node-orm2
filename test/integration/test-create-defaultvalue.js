var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_create_defaultvalue', db.driver.db, function () {
		var TestModel = db.define('test_create_defaultvalue', common.getModelProperties());

		TestModel.create([
			{ name: null }
		], function (err) {
			TestModel.find(function (err, items) {
				assert.equal(err, null);
				assert.equal(Array.isArray(items), true);
				assert.equal(items.length, 1);
				assert.equal(items[0].name, "test_default_value");
				db.close();
			});
		});
	});
});
