var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_settings_properties_primary_key', db.driver.db, function () {
		common.insertModelData('test_settings_properties_primary_key', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test3' },
			{ id : 4, name : 'test4' },
			{ id : 5, name : 'test5' }
		], function (err) {
			if (err) throw err;

			db.settings.set('properties.primary_key', 'name');

			var properties = common.getModelProperties();
			// since "id" is no longer primary key and instances ignore non model properties,
			// we have to define "id" as a common property so we can check it later
			properties.id = Number;

			var TestModel = db.define('test_settings_properties_primary_key', properties);

			TestModel.get('test4', function (err, Test4) {
				assert.equal(err, null);
				assert.equal(Test4.id, 4);
				assert.equal(Test4.name, 'test4');

				db.close();
			});
		});
	});
});
