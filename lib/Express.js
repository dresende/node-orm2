var orm     = require("./ORM");
var _models = {};
var _db     = null;

module.exports = function (uri, opts) {
	opts = opts || {};

	orm.connect(uri, function (err, db) {
		if (err) {
			if (typeof opts.error == "function") {
				opts.error(err);
			} else {
				throw err;
			}
			return;
		}

		if (Array.isArray(_db)) {
			_db.push(db);
		} else if (_db !== null) {
			_db = [ _db, db ];
		} else {
			_db = db;
		}
		if (typeof opts.define == "function") {
			opts.define(db, _models);
		}
	});

	return function ORM(req, res, next) {
		if (req.hasOwnProperty("models")) {
			return next();
		}

		req.models = _models;
		req.db     = _db;

		return next();
	};
};
