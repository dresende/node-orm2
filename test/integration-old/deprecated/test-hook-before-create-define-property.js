var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_hook_before_create_define_property', db.driver.db, function () {
		var name = "Name was undefined";
		var TestModel = db.define('test_hook_before_create_define_property', common.getModelProperties(), {
			hooks: {
				beforeCreate: function () {
					this.name = name;
				}
			}
		});

		var Test = new TestModel();
		Test.save(function (err) {
			assert.equal(err, null);
			assert.equal(Test.name, name);
			db.close();
		});
	});
});
