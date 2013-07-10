module.exports = function (db, cb) {
	setTimeout(function () {
		return cb();
	}, 500);
};
