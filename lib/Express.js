var orm = require("./ORM");

module.exports = function (uri, opts) {
	var _db = null;
	var _models = {};

	opts = opts || {};

	orm.connect(uri, function (err, db) {
		if (err) {
			if (typeof opts.error == "function") {
				opts.error(err);
			}
			return;
		}

		_db = db;
		if (typeof opts.define == "function") {
			opts.define(db, _models, function () {
				if (Object.keys(_models).length > 0) {
					_db = _models;
				}
			});
		}
	});

	return function ORM(req, res, next) {
		req.db = _db;

		return next();
	};
};
