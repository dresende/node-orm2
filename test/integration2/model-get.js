var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var async    = require('async');
var ORM      = require('../../');

describe("Model.get()", function() {
	var db = null;
	var Person = null;

	var setup = function (cache) {
		return function (done) {
			Person = db.define("person", {
				name   : String
			}, {
				cache  : cache,
				methods: {
					UID: function () {
						return this.id;
					}
				}
			});

			ORM.singleton.clear(); // clear cache

			return helper.dropSync(Person, function () {
				Person.create([{
					name: "John Doe"
				}, {
					name: "Jane Doe"
				}], done);
			});
		};
	};

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			return done();
		});
	});

	after(function () {
		return db.close();
	});

	describe("with cache", function () {
		before(setup(true));

		it("should return item with id 1", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");
				John.should.have.property("id", 1);
				John.should.have.property("name", "John Doe");

				return done();
			});
		});

		it("should have an UID method", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.UID.should.be.a("function");
				John.UID().should.equal(John.id);

				return done();
			});
		});

		describe("changing name and getting id 1 again", function () {
			it("should return the original object with unchanged name", function (done) {
				Person.get(1, function (err, John1) {
					should.equal(err, null);

					John1.name = "James";

					Person.get(1, function (err, John2) {
						should.equal(err, null);

						John1.id.should.equal(John2.id);
						John2.name.should.equal("John Doe");

						return done();
					});
				});
			});
		});
	});

	describe("with no cache", function () {
		before(setup(false));

		describe("fetching several times", function () {
			it("should return different objects", function (done) {
				Person.get(1, function (err, John1) {
					should.equal(err, null);
					Person.get(1, function (err, John2) {
						should.equal(err, null);

						John1.id.should.equal(John2.id);
						John1.should.not.equal(John2);

						return done();
					});
				});
			});
		});
	});

	describe("with cache = 0.5 secs", function () {
		before(setup(0.5));

		describe("fetching again after 0.2 secs", function () {
			it("should return same objects", function (done) {
				Person.get(1, function (err, John1) {
					should.equal(err, null);

					setTimeout(function () {
						Person.get(1, function (err, John2) {
							should.equal(err, null);

							John1.id.should.equal(John2.id);
							John1.should.equal(John2);

							return done();
						});
					}, 200);
				});
			});
		});

		describe("fetching again after 0.7 secs", function () {
			it("should return different objects", function (done) {
				Person.get(1, function (err, John1) {
					should.equal(err, null);

					setTimeout(function () {
						Person.get(1, function (err, John2) {
							should.equal(err, null);

							John1.should.not.equal(John2);

							return done();
						});
					}, 700);
				});
			});
		});
	});

	describe("with empty object as options", function () {
		before(setup());

		it("should return item with id 1 like previously", function (done) {
			Person.get(1, {}, function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");
				John.should.have.property("id", 1);
				John.should.have.property("name", "John Doe")

				return done();
			});
		});
	});
});
