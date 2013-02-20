var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModel2Table('test_association_hasone_reverse', db.driver.db, function () {
			common.insertModel2Data('test_association_hasone_reverse', db.driver.db, [
				{ id : 1, name : 'test1', assoc: 2 },
				{ id : 2, name : 'test2', assoc: 0 }
			], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_association_hasone_reverse', common.getModelProperties());
			TestModel.hasOne("assoc", TestModel, { reverse: "reverseassoc" });

			TestModel(2).getReverseassoc(function (err, Tests) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Tests), true);
				assert.equal(typeof Tests[0], "object");
				assert.equal(Tests[0].id, 1);
				db.close();
			});
		});
	});
});
