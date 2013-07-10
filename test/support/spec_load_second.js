module.exports = function (db, cb) {
	db.define("pet", {
		name : String
	});

	setTimeout(function () {
		return cb();
	}, 200);
};
