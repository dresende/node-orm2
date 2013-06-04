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
			var data = [{ poc: 'John Doe', first_name: 'John', last_name: 'Doe' }];			
						
			Contact.create( data, function(err, items) {
				if (err) throw err;
				assert(items[0].poc, 'John Doe');
			});
			
		}
	});
});