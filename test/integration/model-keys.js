var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model keys option", function() {
	var db = null;

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			return done();
		});
	});

	after(function () {
		return db.close();
	});

	describe("if model id is a property", function () {
		var Person = null;

		before(function (done) {
			Person = db.define("person", {
				uid     : String,
				name    : String,
				surname : String
			}, {
				id      : "uid"
			});

			return helper.dropSync(Person, done);
		});

		it("should not auto increment IDs", function (done) {
			Person.create({
				uid     : "john-doe",
				name    : "John",
				surname : "Doe"
			}, function (err, JohnDoe) {
				should.equal(err, null);

				JohnDoe.uid.should.equal("john-doe");
				JohnDoe.should.not.have.property("id");

				return done();
			});
		});
	});

	describe("if model defines several keys", function () {
		var DoorAccessHistory = null;

		before(function (done) {
			DoorAccessHistory = db.define("door_access_history", {
				year   : { type: 'number', rational: false },
				month  : { type: 'number', rational: false },
				day    : { type: 'number', rational: false },
				user   : String,
				action : [ "in", "out" ]
			}, {
				id   : [ "year", "month", "day" ]
			});

			return helper.dropSync(DoorAccessHistory, function () {
				DoorAccessHistory.create([
					{ year: 2013, month: 7, day : 11, user : "dresende", action : "in" },
					{ year: 2013, month: 7, day : 12, user : "dresende", action : "out" }
				], done);
			});
		});

		it("should make possible to get instances based on all keys", function (done) {
			DoorAccessHistory.get(2013, 7, 11, function (err, HistoryItem) {
				should.equal(err, null);

				HistoryItem.year.should.equal(2013);
				HistoryItem.month.should.equal(7);
				HistoryItem.day.should.equal(11);
				HistoryItem.user.should.equal("dresende");
				HistoryItem.action.should.equal("in");

				return done();
			})
		});

		it("should make possible to remove instances based on all keys", function (done) {
			DoorAccessHistory.get(2013, 7, 12, function (err, HistoryItem) {
				should.equal(err, null);

				HistoryItem.remove(function (err) {
					should.equal(err, null);

					DoorAccessHistory.get(2013, 7, 12, function (err) {
						err.should.have.property("code", ORM.ErrorCodes.NOT_FOUND);

						DoorAccessHistory.exists(2013, 7, 12, function (err, exists) {
							should.equal(err, null);

							exists.should.be.false;

							return done();
						});
					});
				});
			})
		});
	});
});
