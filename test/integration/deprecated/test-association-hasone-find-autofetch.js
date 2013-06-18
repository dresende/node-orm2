var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModel2Table('test_association_hasone_find_autofetch', db.driver.db, function () {
		common.insertModel2Data('test_association_hasone_find_autofetch', db.driver.db, [
			{ id : 1, name : 'test1', assoc: 2 },
			{ id : 2, name : 'test2', assoc: 0 }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_association_hasone_find_autofetch', common.getModelProperties());
			TestModel.hasOne("assoc");

			TestModel.find({ id: 1 }, { autoFetch: true }, function (err, Tests) {
				assert.equal(err, null);
				assert.equal(Array.isArray(Tests), true);
				assert.equal(Tests.length, 1);
				assert.equal(Tests[0].assoc_id, 2);
				assert.equal(typeof Tests[0].assoc, "object");
				assert.equal(Tests[0].assoc.id, 2);
				db.close();
			});
		});
	});
});
