var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModel2Table('test_get_association_hasone', db.driver.db, function () {
			common.insertModel2Data('test_get_association_hasone', db.driver.db, [
				{ id : 1, name : 'test1', assoc: 2 },
				{ id : 2, name : 'test2', assoc: 0 }
			], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_get_association_hasone', common.getModelProperties());
			TestModel.hasOne("assoc");

			TestModel(1).getAssoc(function (err, Test2) {
				assert.equal(err, null);
				assert.equal(typeof Test2, "object");
				assert.equal(Test2.id, 2);
				db.close();
			});
		});
	});
});
