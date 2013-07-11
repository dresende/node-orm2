var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_save', db.driver.db, function () {
		var TestModel = db.define('test_save', common.getModelProperties());

		var test1 = new TestModel({
			name: "test"
		});

		test1.save(function (err) {
			assert.equal(err, null);

			TestModel.get(test1.id, function (err, test2) {
				assert.equal(err, null);
				assert.equal(test1.id, test2.id);
				assert.equal(test1.name, test2.name);

				db.close();
			});
		});
	});
});
