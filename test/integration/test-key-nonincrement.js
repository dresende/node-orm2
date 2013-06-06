var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
	assert.equal(err, null);

	//define model with non-autoincrement primary key
	var Contact = db.define('test-key-nonincrement', {
		poc: { title: "POC", type: 'text', size: 65, required: true},
		first_name: { type: 'text', size: 32, required: true},
		last_name: { type: 'text', size: 32, required: true}
	}, {
		id: 'poc'
	});

	// drop & sync the model (remove all data)
	Contact.drop(function (err) {
		assert.equal(err, null);

		Contact.sync(function (err) {
			assert.equal(err, null);

			//if sync is good, insert a record
			var data = [{ poc: 'John Doe', first_name: 'John', last_name: 'Doe' }];

			Contact.create(data, function (err, items) {
				assert.equal(err, null);
				assert.equal(items[0].poc, 'John Doe');

				db.close();
			});
		});
	});
});
