module.exports = function (db, cb) {
	db.load("../model", function (err) {
		setTimeout(function () {
			return cb();
		}, 500);
	});
};
