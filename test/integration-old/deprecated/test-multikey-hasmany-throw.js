var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createKeysModelTable('test_multikey_find', db.driver.db, [ 'id1', 'id2', 'id3' ], function () {
		common.insertKeysModelData('test_multikey_find', db.driver.db, [
			{ id1 : 1, id2 : 1, id3: 1, name : 'test111' },
			{ id1 : 1, id2 : 2, id3: 3, name : 'test123' },
			{ id1 : 2, id2 : 3, id3: 1, name : 'test231' },
			{ id1 : 3, id2 : 1, id3: 2, name : 'test312' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_multikey_find', common.getModelProperties(), {
				keys  : [ 'id1', 'id2', 'id3' ],
				cache : false
			});

			assert.throws(function () {
				TestModel.hasMany("whatever");
			}, /support/); // "does not support"

			db.close();
		});
	});
});
