var Q = require("q");

module.exports.sql = {
	execQuery: function () {
		var cb, query, res;
		if (arguments.length == 1) {
			query = arguments[0];
			cb = null;
		} else if (arguments.length == 2) {
			if (typeof arguments[1] == "function") {
				query = arguments[0];
				cb = arguments[1];
			} else {
				query = this.query.escape(arguments[0], arguments[1]);
				cb = null;
			}
		} else if (arguments.length == 3) {
			query = this.query.escape(arguments[0], arguments[1]);
			cb = arguments[2];
		}

		var defered = null;
		if (!cb) {
			var defered = Q.defer();
			cb = function (err, obj) {
				if (err) {
					defered.reject(err);
				} else {
					defered.resolve(obj);
				}
			}
		}

		res = this.execSimpleQuery(query, cb);
		return defered ? defered.promise : res;
	}
}