var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.count()", function() {
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
					name: "John Doe"
				}, {
					id  : 2,
					name: "Jane Doe"
				}, {
					id  : 3,
					name: "John Doe"
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
			Person.count.should.throw();

			return done();
		});
	});

	describe("without conditions", function () {
		before(setup());

		it("should return all items in model", function (done) {
			Person.count(function (err, count) {
				should.equal(err, null);

				count.should.equal(3);

				return done();
			});
		});
	});

	describe("with conditions", function () {
		before(setup());

		it("should return only matching items", function (done) {
			Person.count({ name: "John Doe" }, function (err, count) {
				should.equal(err, null);

				count.should.equal(2);

				return done();
			});
		});
	});
});
