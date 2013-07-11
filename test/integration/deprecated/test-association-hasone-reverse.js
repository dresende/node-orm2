var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasone_reverse_parent', db.driver.db, function() {
		common.createModel2Table('test_association_hasone_reverse_child', db.driver.db, function () {
			common.insertModelData('test_association_hasone_reverse_parent', db.driver.db, [
					{ id : 1, name : 'parent 1' },
					{ id : 2, name : 'parent 2' }
				], function (err) {
				if (err) throw err;
				common.insertModel2Data('test_association_hasone_reverse_child', db.driver.db, [
						{ id : 1, name : 'child 1', assoc: 2 },
						{ id : 2, name : 'child 2', assoc: 1 }
					], function (err) {
					if (err) throw err;

					var TestModelParent = db.define('test_association_hasone_reverse_parent', common.getModelProperties());
					var TestModelChild  = db.define('test_association_hasone_reverse_child',  common.getModelProperties());
					TestModelChild.hasOne("assoc", TestModelParent, { reverse: "reverseassoc" });

					TestModelParent(2).getReverseassoc(function (err, children) {
						assert.equal(err, null);
						assert.equal(Array.isArray(children), true);
						assert.equal(typeof children[0], "object");
						assert.equal(children[0].id, 1);

						// Make sure the association field hasn't been erroneously added to the reverse association model.
						TestModelParent.find({}, function (err, parents) {
							assert.equal(err, null);
							assert.equal(parents[0].hasOwnProperty('name'), true);
							assert.equal(parents[0].hasOwnProperty('assoc_id'), false);

							db.close();
						});
					});
				});
			});
		});
	});
});
