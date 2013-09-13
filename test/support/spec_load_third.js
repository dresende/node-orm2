module.exports = function (db, cb) {
	db.define("person", {
		name : String
	});

	setTimeout(function () {
		return cb();
	}, 200);
};
