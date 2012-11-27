var common     = require('../common');
var assert     = require('assert');
var mysql      = require('mysql');

var url = 'mysql://root@localhost/orm_test';

if (!common.isTravis()) {
	url = (process.env.ORM_PROTOCOL || 'mysql') +
	      '://' +
	      (process.env.ORM_USER || 'root') +
	      (process.env.ORM_PASSWORD ? ':' + process.env.ORM_PASSWORD : '') +
	      '@' + (process.env.ORM_HOST || 'localhost') +
	      '/' + (process.env.ORM_DATABASE || 'orm_test');
}

var connection = mysql.createConnection(url);
connection.connect(function (err) {
	assert.equal(err, null);

	common.ORM.use(connection, "mysql", function (err, db) {
		assert.equal(err, null);
		assert.equal(typeof db, "object");
		assert.equal(typeof db.define, "function");
		assert.equal(typeof db.close, "function");
		assert.equal(typeof db.models, "object");

		db.close();
	});
});
