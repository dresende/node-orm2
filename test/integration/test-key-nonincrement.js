var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {

	//define model with non-autoincrement primary key
	var Contact = db.define('test-key-nonincrement', {
		poc: { title:"POC", type: 'text', size: 65, required: true},
		first_name: { type: 'text', size: 32, required: true},
		last_name: { type: 'text', size: 32, required: true}
	}, {
		id: 'poc'
	});

	//sync the model to create the table if necessary
	Contact.sync( function(err) {
		if (err) {
			console.error(err);
			db.close();
		} else {

			//if sync is good, insert a record
			var data = [{ poc: 'Edward Kline', first_name: 'Edward', last_name: 'Kline' }];


			Contact.create( data, function(err, items) {
				if (err) throw err;

				console.log(items[0].poc, items[0].first_name, items[0].last_name);
				assert(items[0].poc, 'Edward Kline');
				db.close();
			});

		}
	});
});