var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_exists_array', db.driver.db, function () {
		common.insertModelData('test_exists_array', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test3' },
			{ id : 4, name : 'test4' },
			{ id : 5, name : 'test5' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_exists_array', common.getModelProperties());
			var tests = 2;

			TestModel.exists([ 4 ], function (err, exists) {
				assert.equal(err, null);
				assert.equal(exists, true);

				if (--tests === 0) {
					db.close();
				}
			});
			TestModel.exists([ 6 ], function (err, exists) {
				assert.equal(err, null);
				assert.equal(exists, false);

				if (--tests === 0) {
					db.close();
				}
			});
		});
	});
});
