var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	var TestModel = db.define('test_save_hasone_association_new', common.getModelProperties());
	TestModel.hasOne("assoc", TestModel, { required: false });

	TestModel.drop(function (err) {
		assert.equal(err, null);

		TestModel.sync(function (err) {
			assert.equal(err, null);

			var test1 = new TestModel({
				name : "test1",
				assoc: {
					name: "test2"
				}
			});

			test1.save(function (err) {
				assert.equal(err, null);
				assert.equal(test1.assoc.saved(), true);

				db.close();
			});
		});
	});
});
