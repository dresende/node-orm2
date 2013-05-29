var common		 = require('../common');
var assert		 = require('assert');

common.createConnection(function (err, db) {
	common.createModelTable('test_association_hasone_reverse_updown_up', db.driver.db, function() {
		common.createModelAssocUpDownTable('test_association_hasone_reverse_updown', db.driver.db, function () {
			common.createModelTable('test_association_hasone_reverse_updown_down', db.driver.db, function () {
				common.insertModelData('test_association_hasone_reverse_updown_up', db.driver.db, [
					{ id : 1, name : 'parent 1' },
					{ id : 2, name : 'parent 2' }
					], function (err) {
						if (err) throw err;
						common.insertModelData('test_association_hasone_reverse_updown_down', db.driver.db, [
							{ id : 1, name : 'grandchild 1' }
							], function (err) {
								if (err) throw err;
								common.insertModelAssocUpDownData('test_association_hasone_reverse_updown', db.driver.db, [
									{ id : 1, name : 'child 1', assocup: 2, assocdown: 1 },
									{ id : 2, name : 'child 2', assocup: 1, assocdown: 1 }
									], function (err) {
										if (err) throw err;

										var TestModelParent = db.define('test_association_hasone_reverse_updown_up', common.getModelProperties(), { autoFetchLimit: 2 });
										var TestModelChild	= db.define('test_association_hasone_reverse_updown',	common.getModelProperties());
										var TestModelGrandChild	= db.define('test_association_hasone_reverse_updown_down',	common.getModelProperties());
										TestModelChild.hasOne("assocup", TestModelParent, {
                      autoFetch: true, 
                      reverse: "reverseassoc" 
                    });
										TestModelChild.hasOne("assocdown", TestModelGrandChild, { autoFetch: true });

										TestModelParent.get(2, function (err, par) {
											assert.equal(err, null);
											assert.equal(Array.isArray(par.reverseassoc), true);
											assert.equal(typeof par.reverseassoc[0], "object");
											assert.equal(par.reverseassoc[0].id, 1);
											assert.equal(typeof par.reverseassoc[0].assocdown, "object");

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
	});
});
