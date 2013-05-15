var common     = require('../common');
var assert     = require('assert');
var async      = require('async');

common.createConnection(function (err, db) {
	common.createModelTable('test_create', db.driver.db, function () {
		var TestModel = db.define('test_create', common.getModelProperties());

		async.series([
			// Test that items are actually created
			function (done) {
				TestModel.create([
					{ name: 'test1' },
					{ name: 'test2' },
					{ name: 'test3' }
				], function (err) {
					TestModel.count(function (err, count) {
						assert.equal(err, null);
						assert.equal(count, 3);
						done();
					});
				});
			},
			function (done) {
				TestModel.create({ name: 'test4' }, function (err) {
					TestModel.count(function (err, count) {
						assert.equal(err, null);
						assert.equal(count, 4);
						done();
					});
				});
			},
			// Test callback arguments
			function (done) {
				TestModel.create([
					{ name: 'test5' },
					{ name: 'test6' }
				], function (err, items) {
					assert.equal(err, null);
					assert.equal(Array.isArray(items), true);
					assert.equal(items.length, 2);
					done();
				});
			},
			function (done) {
				TestModel.create({ name: 'test7' }, function (err, item) {
					assert.equal(err, null);
					assert.equal(Array.isArray(item), false);
					assert.equal(item.name, 'test7');
					assert.equal(item.hasOwnProperty('id'), true);
					done();
				});
			}
		], function complete() {
			db.close();
		});
	});
});
