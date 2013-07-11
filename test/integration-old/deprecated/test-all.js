var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_all', db.driver.db, function () {
		common.insertModelData('test_all', db.driver.db, [
			{ id : 1, name : 'test2' },
			{ id : 2, name : 'test2' },
			{ id : 3, name : 'test1' },
			{ id : 4, name : 'test1' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_all', common.getModelProperties());

			// just to see if Model.all() is passing everything to Model.find()
			TestModel.all({ name: 'test1' }, 1, 'id', function (err, Instances) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Instances), true);
				assert.equal(Instances.length, 1);
				assert.equal(Instances[0].id, 3);
				db.close();
			});
		});
	});
});
