var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_rechain', db.driver.db, function () {
		common.insertModelData('test_find_rechain', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test1' },
			{ id : 4, name : 'test2' },
			{ id : 5, name : 'test1' },
			{ id : 6, name : 'test2' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_find_rechain', common.getModelProperties());

			TestModel.aboveId3 = function () {
				return this.find({ id : db.tools.gt(3) });
			};
			TestModel.onlyTest1 = function () {
				return this.find({ name : 'test1' });
			};

			TestModel.aboveId3().onlyTest1().run(function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances[0].id, 5);
				assert.equal(Instances[0].name, 'test1');
				db.close();
			});
		});
	});
});
