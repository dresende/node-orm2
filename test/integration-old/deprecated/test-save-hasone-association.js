var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	var TestModel = db.define('test_save_hasone_association', common.getModelProperties());
	TestModel.hasOne("assoc");

	TestModel.drop(function (err) {
		assert.equal(err, null);

		TestModel.sync(function (err) {
			assert.equal(err, null);

			var test2 = new TestModel({
				name: "test2"
			});
			var test1 = new TestModel({
				name : "test1",
				assoc: test2
			});

			test1.save(function (err) {
				assert.equal(err, null);
				assert.equal(test2.saved(), true);

				db.close();
			});
		});
	});
});
