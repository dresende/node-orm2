var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.clear()", function() {
	var db = null;
	var Person = null;

	var setup = function () {
		return function (done) {
			Person = db.define("person", {
				name   : String
			});

			ORM.singleton.clear();

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

	describe("with callback", function () {
		before(setup());

		it("should call when done", function (done) {
			Person.clear(function (err) {
				should.equal(err, null);

				Person.find().count(function (err, count) {
					count.should.equal(0);

					return done();
				});
			});
		});
	});

	describe("without callback", function () {
		before(setup());

		it("should still remove", function (done) {
			Person.clear();

			setTimeout(function () {
				Person.find().count(function (err, count) {
					count.should.equal(0);

					return done();
				});
			}, 200);
		});
	});
});
