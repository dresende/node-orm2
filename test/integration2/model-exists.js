var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.exists()", function() {
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

	describe("without callback", function () {
		before(setup());

		it("should throw", function (done) {
			Person.exists.should.throw();

			return done();
		});
	});

	describe("with an id", function () {
		before(setup());

		it("should return true if found", function (done) {
			Person.exists(2, function (err, exists) {
				should.equal(err, null);

				exists.should.be.true;

				return done();
			});
		});

		it("should return false if not found", function (done) {
			Person.exists(4, function (err, exists) {
				should.equal(err, null);

				exists.should.be.false;

				return done();
			});
		});
	});

	describe("with a list of ids", function () {
		before(setup());

		it("should return true if found", function (done) {
			Person.exists([ 2 ], function (err, exists) {
				should.equal(err, null);

				exists.should.be.true;

				return done();
			});
		});

		it("should return false if not found", function (done) {
			Person.exists([ 4 ], function (err, exists) {
				should.equal(err, null);

				exists.should.be.false;

				return done();
			});
		});
	});

	describe("with a conditions object", function () {
		before(setup());

		it("should return true if found", function (done) {
			Person.exists({ name: "John Doe" }, function (err, exists) {
				should.equal(err, null);

				exists.should.be.true;

				return done();
			});
		});

		it("should return false if not found", function (done) {
			Person.exists({ name: "Jack Doe" }, function (err, exists) {
				should.equal(err, null);

				exists.should.be.false;

				return done();
			});
		});
	});
});
