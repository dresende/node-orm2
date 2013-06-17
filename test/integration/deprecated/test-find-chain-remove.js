var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_chain_remove', db.driver.db, function () {
		common.insertModelData('test_find_chain_remove', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test3' },
			{ id : 4, name : 'test4' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_chain_remove', common.getModelProperties());

			TestModel.find({ name: [ 'test2', 'test3' ] }).remove(function (err) {
				assert.equal(err, null);

				TestModel.find().count(function (err, count) {
					assert.equal(err, null);
					assert.equal(count, 2);
					db.close();
				});
			});
		});
	});
});
