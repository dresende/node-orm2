var common     = require('../common');
var assert     = require('assert');

var connection;

switch (common.protocol()) {
	case 'mysql':
		connection = require('mysql').createConnection(common.getConnectionString());
		connection.connect(test_use);
		break;
	case 'postgres':
		connection = new (require('pg').Client)(common.getConnectionString());
		connection.connect(test_use);
		break;
	case 'sqlite':
		connection = new (require('sqlite3').Database)(common.getConnectionString().substr(9));
		test_use(null);
		break;
}

function test_use(err) {
	assert.equal(err, null);

	common.ORM.use(connection, process.env.ORM_PROTOCOL, function (err, db) {
		assert.equal(err, null);
		assert.equal(typeof db, "object");
		assert.equal(typeof db.define, "function");
		assert.equal(typeof db.close, "function");
		assert.equal(typeof db.models, "object");

		db.close();
	});
}
