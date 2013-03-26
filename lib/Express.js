var orm      = require("./ORM");
var _models  = {};
var _db      = null;
var _pending = 0;
var _queue   = [];

module.exports = function (uri, opts) {
	opts = opts || {};

	_pending += 1;

	orm.connect(uri, function (err, db) {
		_pending -= 1;

		if (err) {
			if (typeof opts.error == "function") {
				opts.error(err);
			} else {
				throw err;
			}

			return checkRequestQueue();
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

		return checkRequestQueue();
	});

	return function ORM(req, res, next) {
		if (!req.hasOwnProperty("models")) {
			req.models = _models;
			req.db     = _db;
		}

		if (_pending > 0) {
			_queue.push(next);
			return;
		}

		return next();
	};
};

function checkRequestQueue() {
	if (_pending > 0) return;
	if (_queue.length === 0) return;

	for (var i = 0; i < _queue.length; i++) {
		_queue[i]();
	}

	_queue.length = 0;
}
