var uuid = require('node-uuid');

var connection = [];

exports.addConnection = function(con) {
	var id = uuid.v4();
	connection.push({
		obj: con,
		id: id
	});
	return id;
}

exports.getConnection = function(id) {
	for (var i = 0; i < connection.length; ++i)
		if (connection[i].id == id)
			return connection[i].obj;
	return null;
}

exports.removeConnection = function(id) {
	for (var i = 0; i < connection.length; ++i)
		if (connection[i].id == id) {
			connection.splice(i, 1);
			break;
		}
}