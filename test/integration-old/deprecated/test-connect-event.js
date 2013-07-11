var common      = require('../common');
var assert      = require('assert');
var config      = common.getConfig();

config.protocol = common.protocol();

var db = common.ORM.connect(config);
db.on("connect", function (err, db) {
	assert.equal(err, null);
	assert.equal(typeof db, "object");

	db.close();
});
