var common = exports;
var path   = require('path');
var ORM    = require('../');

common.ORM = ORM;

common.isTravis = function() {
	return Boolean(process.env.CI);
};

common.createConnection = function(cb) {
	var url = 'mysql://root@localhost/orm_test';

	if (!common.isTravis()) {
		url = (process.env.ORM_PROTOCOL || 'mysql') +
		      '://' +
		      (process.env.ORM_USER || 'root') +
		      (process.env.ORM_PASSWORD ? ':' + process.env.ORM_PASSWORD : '') +
		      '@' + (process.env.ORM_HOST || 'localhost') +
		      '/' + (process.env.ORM_DATABASE || 'orm_test');
	}

	ORM.connect(url, cb);
};
