var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	var TestModel = db.define('test_sync', common.getModelProperties());

	TestModel.sync(function (err) {
		if (err !== null) {
			// not supported by all drivers
			return db.close();
		}

		TestModel.clear(function (err) {
			assert.equal(err, null);

			var Test1 = new TestModel({
				name: "test1"
			});
			Test1.save(function (err) {
				assert.equal(err, null);

				TestModel.find({ name: "test1" }, function (err, tests) {
					assert.equal(err, null);
					assert.equal(tests.length, 1);

					db.close();
				});
			});
		});
	});
});
