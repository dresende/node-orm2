var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	db.ping(function (err) {
		assert.equal(err, null);

		db.close();
	});
});
