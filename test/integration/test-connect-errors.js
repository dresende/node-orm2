var common      = require('../common');
var assert      = require('assert');

addTest("",         "CONNECTION_URL_EMPTY");
addTest("whatever", "CONNECTION_URL_NO_PROTOCOL");
addTest("mysql://", "CONNECTION_URL_NO_DATABASE");

function addTest(uri, error_msg) {
	common.ORM.connect(uri, function (err) {
		assert.equal(err instanceof Error, true);
		assert.equal(err.message, error_msg);
	});
}
