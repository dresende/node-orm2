var async    = require('async');
var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var common   = require('../common');

describe("Big data sets", function () {
	var db = null;
	var Like = null;

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			return done();
		});
	});

	after(function () {
		return db.close();
	});

	// TODO: Fix
	xdescribe("Chain.remove() with 50,000 records", function () {
		this.timeout(60000);

		before(function (done) {
			Like = db.define("like", { t: { type: 'integer' } });

			helper.dropSync(Like, function (err) {
				should.not.exist(err);

				async.times(5000, function (n, cb) {
					db.driver.execQuery(
						"INSERT INTO ?? (??) VALUES (?),(?),(?),(?),(?),(?),(?),(?),(?),(?)",
						['like', 't', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
						function (err) {
							should.not.exist(err);
							cb();
						}
					);
				}, function (err) {
					should.not.exist(err);
					done()
				});
			});
		});

		it("should work", function (done) {
			Like.find().remove(function (err) {
				should.not.exist(err);
				done();
			});
		});
	});
});
