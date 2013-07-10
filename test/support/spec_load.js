module.exports = function (db, cb) {
	db.define("person", {
		name : String
	});

	return db.load("./spec_load_second", cb);
};
