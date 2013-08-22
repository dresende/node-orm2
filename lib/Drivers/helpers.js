
module.exports.sql = {
	execQuery: function () {
		if (arguments.length == 2) {
			var query = arguments[0];
			var cb    = arguments[1];
		} else if (arguments.length == 3) {
			var query = this.query.escape(arguments[0], arguments[1]);
			var cb    = arguments[2];
		}
		return this.execSimpleQuery(query, cb);
	}
}
