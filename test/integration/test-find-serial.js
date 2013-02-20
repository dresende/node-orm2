var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_find_serial1', db.driver.db, function () {
		common.insertModelData('test_find_serial1', db.driver.db, [
			{ id : 1, name : 'test1' },
			{ id : 2, name : 'test2' }
		], function () {
			common.createModelTable('test_find_serial2', db.driver.db, function () {
				common.insertModelData('test_find_serial2', db.driver.db, [
					{ id : 1, name : 'test1' },
					{ id : 2, name : 'test2' },
					{ id : 3, name : 'test3' },
					{ id : 4, name : 'test4' }
				], function () {
					var TestModel1 = db.define('test_find_serial1', common.getModelProperties());
					var TestModel2 = db.define('test_find_serial2', common.getModelProperties());

					db.serial(
						TestModel1.find(),
						TestModel2.find({ name: 'test2' })
					).get(function (err, tests1, tests2) {
						assert.equal(err, null);
						assert.equal(tests1.length, 2);
						assert.equal(tests2.length, 1);
						db.close();
					});
				});
			});
		});
	});
});
