var should     = require('should');
var helper     = require('../support/spec_helper');
var validators = require('../../').validators;
var common = require('../common');
var protocol = common.protocol().toLowerCase();
var undef      = undefined;

function checkValidation(done, expected) {
	return function (returned) {
		should.equal(returned, expected);

		return done();
	};
}

describe("Predefined Validators", function () {

	describe("equalToProperty('name')", function () {
		it("should pass if equal", function (done) {
			validators.equalToProperty('name').call({ name: "John Doe" }, 'John Doe', checkValidation(done));
		});
		it("should not pass if not equal", function (done) {
			validators.equalToProperty('name').call({ name: "John" }, 'John Doe', checkValidation(done, 'not-equal-to-property'));
		});
		it("should not pass even if equal to other property", function (done) {
			validators.equalToProperty('name').call({ surname: "John Doe" }, 'John Doe', checkValidation(done, 'not-equal-to-property'));
		});
	});

	describe("unique()", function () {
	    if (protocol === "mongodb") return;

		var db = null;
		var Person = null;

		var setup = function () {
			return function (done) {
				Person = db.define("person", {
					name    : String,
					surname : String
				}, {
					validations: {
						surname: validators.unique()
					}
				});

				Person.settings.set("instance.returnAllErrors", false);

				return helper.dropSync(Person, function () {
					Person.create([{
						name    : "John",
						surname : "Doe"
					}], done);
				});
			};
		};

		before(function (done) {
			helper.connect(function (connection) {
				db = connection;

				return setup()(done);
			});
		});

		after(function () {
			return db.close();
		});

		it("should not pass if more elements with that property exist", function (done) {
			var janeDoe = new Person({
				name    : "Jane",
				surname : "Doe" // <-- in table already!
			});
			janeDoe.save(function (err) {
				err.should.be.a("object");
				err.should.have.property("property", "surname");
				err.should.have.property("value",    "Doe");
				err.should.have.property("msg",      "not-unique");

				return done();
			});
		});

		it("should pass if no more elements with that property exist", function (done) {
			var janeDean = new Person({
				name    : "Jane",
				surname : "Dean" // <-- not in table
			});
			janeDean.save(function (err) {
				should.equal(err, null);

				return done();
			});
		});

		it("should pass if resaving the same instance", function (done) {
			Person.find({ name: "John", surname: "Doe" }, function (err, Johns) {
				should.equal(err, null);
				Johns.should.have.property("length", 1);

				Johns[0].surname = "Doe"; // forcing resave

				Johns[0].save(function (err) {
					should.equal(err, null);

					return done();
				});
			});
		});
	});

});
