var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	// should load:
	//
	// models/sub/index
	// models/model (called from models/sub/index)
	db.load("./models/sub/", function (err) {
		assert.equal(err, null);
		db.close();
	});
});
