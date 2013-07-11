var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.one()", function() {
	var db = null;
	var Person = null;

	var setup = function () {
		return function (done) {
			Person = db.define("person", {
				name   : String
			});

			return helper.dropSync(Person, function () {
				Person.create([{
					id  : 1,
					name: "Jeremy Doe"
				}, {
					id  : 2,
					name: "John Doe"
				}, {
					id  : 3,
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

	describe("without arguments", function () {
		before(setup());

		it("should return first item in model", function (done) {
			Person.one(function (err, person) {
				should.equal(err, null);

				person.name.should.equal("Jeremy Doe");

				return done();
			});
		});
	});

	describe("without callback", function () {
		before(setup());

		it("should throw", function (done) {
			Person.one.should.throw();

			return done();
		});
	});

	describe("with order", function () {
		before(setup());

		it("should return first item in model based on order", function (done) {
			Person.one("-name", function (err, person) {
				should.equal(err, null);

				person.name.should.equal("John Doe");

				return done();
			});
		});
	});

	describe("with conditions", function () {
		before(setup());

		it("should return first item in model based on conditions", function (done) {
			Person.one({ name: "Jane Doe" }, function (err, person) {
				should.equal(err, null);

				person.name.should.equal("Jane Doe");

				return done();
			});
		});

		describe("if no match", function () {
			before(setup());

			it("should return null", function (done) {
				Person.one({ name: "Jack Doe" }, function (err, person) {
					should.equal(err, null);
					should.equal(person, null);

					return done();
				});
			});
		});
	});
});
