var common     = require('../common');
var assert     = require('assert');

var connection;

switch (process.env.ORM_PROTOCOL) {
	case 'mysql':
		connection = require('mysql').createConnection(common.getConnectionString());
		break;
	case 'postgres':
		connection = new (require('pg').Client)(common.getConnectionString());
		break;
}

connection.connect(function (err) {
	assert.equal(err, null);

	common.ORM.use(connection, process.env.ORM_PROTOCOL, function (err, db) {
		assert.equal(err, null);
		assert.equal(typeof db, "object");
		assert.equal(typeof db.define, "function");
		assert.equal(typeof db.close, "function");
		assert.equal(typeof db.models, "object");

		db.close();
	});
});
