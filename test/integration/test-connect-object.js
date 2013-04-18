var common      = require('../common');
var assert      = require('assert');
var config      = require("../config")[common.protocol()];

config.protocol = common.protocol();

delete config.query; // force a connection without this key

common.ORM.connect(config, function (err, db) {
	assert.equal(err, null);
	assert.equal(typeof db, "object");

	db.close();
});
