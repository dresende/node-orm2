var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	assert.equal(err, null);
	assert.equal(typeof db, "object");
	assert.equal(typeof db.use, "function");
	assert.equal(typeof db.define, "function");
	assert.equal(typeof db.close, "function");
	assert.equal(typeof db.models, "object");

	db.close();
});
