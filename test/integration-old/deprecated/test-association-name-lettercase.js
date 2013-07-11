var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModel2Table('test_association_name_lettercase', db.driver.db, function () {
		common.insertModel2Data('test_association_name_lettercase', db.driver.db, [
			{ id : 1, name : 'test1', assoc: 0 }
		], function (err) {
			if (err) throw err;

			var TestModel = db.define('test_association_name_lettercase', common.getModelProperties());
			TestModel.hasOne("myLetterCase", { field: "assoc_id" });

			TestModel.get(1, function (err, Test1) {
				assert.equal(err, null);

				assert.equal(typeof Test1.getMyLetterCase, "function");
				assert.equal(typeof Test1.setMyLetterCase, "function");
				assert.equal(typeof Test1.hasMyLetterCase, "function");

				db.close();
			});
		});
	});
});
