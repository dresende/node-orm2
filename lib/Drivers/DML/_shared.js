
module.exports = {
	execQuery: function () {
		if (arguments.length == 2) {
			var query = arguments[0];
			var cb    = arguments[1];
			var connectionId = null;
		} else if (arguments.length == 3) {
			if (arguments[1].constructor === Array) {
				var query = this.query.escape(arguments[0], arguments[1]);
				var cb    = arguments[2];
			}
			else {
				var query = arguments[0];
				var connectionId = arguments[1];
				var cb    = arguments[2];
			}
		}
		else if (arguments.length == 4) {
			var query = this.query.escape(arguments[0], arguments[1]);
			var connectionId = arguments[2];
			var cb    = arguments[3];
		}
		return this.execSimpleQuery(query, connectionId, cb);
	},
	eagerQuery: function (association, opts, keys, cb) {
		var desiredKey = Object.keys(association.field);
		var assocKey = Object.keys(association.mergeAssocId);

		var where = {};
		where[desiredKey] = keys;

		var query = this.query.select()
			.from(association.model.table)
			.select(opts.only)
			.from(association.mergeTable, assocKey, opts.keys)
			.select(desiredKey).as("$p")
			.where(association.mergeTable, where)
			.build();

		this.execSimpleQuery(query, null, cb);
	}
};
