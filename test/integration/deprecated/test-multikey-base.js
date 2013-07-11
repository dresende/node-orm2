var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createKeysModelTable('test_multikey_base', db.driver.db, [ 'id1', 'id2', 'id3' ], function () {
		common.insertKeysModelData('test_multikey_base', db.driver.db, [
			{ id1 : 1, id2 : 1, id3: 1, name : 'test111' },
			{ id1 : 1, id2 : 2, id3: 3, name : 'test123' },
			{ id1 : 2, id2 : 3, id3: 1, name : 'test231' },
			{ id1 : 3, id2 : 1, id3: 2, name : 'test312' }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_multikey_base', common.getModelProperties(), {
				keys  : [ 'id1', 'id2', 'id3' ],
				cache : false
			});

			TestModel.get(1, 2, 3, function (err, item) {
				assert.equal(err, null);
				assert.equal(item.name, 'test123');

				item.name = 'tested';

				assert.throws(function () {
					item.id2 = 5;
				}, /cannot change id/i);

				item.save(function (err) {
					assert.equal(err, null);

					TestModel.get(1, 2, 3, function (err, item_copy1) {
						assert.equal(err, null);
						assert.equal(item_copy1.name, 'tested');

						item_copy1.remove(function () {
							assert.equal(err, null);

							TestModel.get(1, 2, 3, function (err, item_copy2) {
								assert.notEqual(err, null);
								assert.equal(err.message, "Not found");

								TestModel.exists(1, 2, 3, function (err, exists) {
									assert.equal(err, null);
									assert.equal(exists, false);

									TestModel.find().count(function (err, count) {
										assert.equal(err, null);
										assert.equal(count, 3);

										db.close();
									});
								});
							});
						});
					});
				});
			});
		});
	});
});
