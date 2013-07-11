var should     = require('should');
var helper     = require('../support/spec_helper');
var validators = require('../../').validators;
var undef      = undefined;

function checkValidation(done, expected) {
	return function (returned) {
		should.equal(returned, expected);

		return done();
	};
}

describe("Predefined Validators", function () {
	describe("rangeNumber(0, 10)", function () {
		it("should pass 5", function (done) {
			validators.rangeNumber(0, 10)(5, checkValidation(done));
		});
		it("should not pass -5 with 'out-of-range-number'", function (done) {
			validators.rangeNumber(0, 10)(-5, checkValidation(done, 'out-of-range-number'));
		});
	});
	describe("rangeNumber(undef, 10)", function () {
		it("should pass -5", function (done) {
			validators.rangeNumber(undef, 10)(-5, checkValidation(done));
		});
		it("should not pass 15 with 'out-of-range-number'", function (done) {
			validators.rangeNumber(undef, 10)(15, checkValidation(done, 'out-of-range-number'));
		});
	});
	describe("rangeNumber(-10, undef)", function () {
		it("should pass -5", function (done) {
			validators.rangeNumber(-10, undef)(-5, checkValidation(done));
		});
	});
	describe("rangeNumber(0, undef)", function () {
		it("should pass 5", function (done) {
			validators.rangeNumber(0, undef)(5, checkValidation(done));
		});
		it("should not pass -5 with 'out-of-range-number'", function (done) {
			validators.rangeNumber(0, undef)(-5, checkValidation(done, 'out-of-range-number'));
		});
		describe("if custom-error is defined", function () {
			it("should not pass -5 with 'custom-error'", function (done) {
				validators.rangeNumber(0, undef, 'custom-error')(-5, checkValidation(done, 'custom-error'));
			});
		});
	});


	describe("rangeLength(0, 10)", function () {
		it("should pass 'test'", function (done) {
			validators.rangeLength(0, 10)('test', checkValidation(done));
		});
	});
	describe("rangeLength(undef, 10)", function () {
		it("should pass 'test'", function (done) {
			validators.rangeLength(undef, 10)('test', checkValidation(done));
		});
	});
	describe("rangeLength(0, undef)", function () {
		it("should pass 'test'", function (done) {
			validators.rangeLength(0, undef)('test', checkValidation(done));
		});
		it("should not pass undefined with 'undefined'", function (done) {
			validators.rangeLength(0, undef)(undef, checkValidation(done, 'undefined'));
		});
	});
	describe("rangeLength(4, undef)", function () {
		it("should pass 'test'", function (done) {
			validators.rangeLength(4, undef)('test', checkValidation(done));
		});
	});
	describe("rangeLength(0, 3)", function () {
		it("should not pass 'test' with 'out-of-range-length'", function (done) {
			validators.rangeLength(0, 3)('test', checkValidation(done, 'out-of-range-length'));
		});
	});
	describe("rangeLength(5, undef)", function () {
		it("should not pass 'test' with 'out-of-range-length'", function (done) {
			validators.rangeLength(5, undef)('test', checkValidation(done, 'out-of-range-length'));
		});
	});
	describe("rangeLength(undef, 3)", function () {
		it("should not pass 'test' with 'out-of-range-length'", function (done) {
			validators.rangeLength(undef, 3)('test', checkValidation(done, 'out-of-range-length'));
		});
		describe("if custom-error is defined", function () {
			it("should not pass 'test' with 'custom-error'", function (done) {
				validators.rangeLength(undef, 3, 'custom-error')('test', checkValidation(done, 'custom-error'));
			});
		});
	});


	describe("insideList([ 1, 2, 3 ])", function () {
		it("should pass 1", function (done) {
			validators.insideList([ 1, 2, 3 ])(1, checkValidation(done));
		});
		it("should pass 2", function (done) {
			validators.insideList([ 1, 2, 3 ])(2, checkValidation(done));
		});
		it("should pass 3", function (done) {
			validators.insideList([ 1, 2, 3 ])(3, checkValidation(done));
		});
		it("should not pass 4 with 'outside-list'", function (done) {
			validators.insideList([ 1, 2, 3 ])(4, checkValidation(done, 'outside-list'));
		});
		it("should not pass '1' with 'outside-list'", function (done) {
			validators.insideList([ 1, 2, 3 ])('1', checkValidation(done, 'outside-list'));
		});
		it("should not pass '' with 'outside-list'", function (done) {
			validators.insideList([ 1, 2, 3 ])('', checkValidation(done, 'outside-list'));
		});
		it("should not pass [] with 'outside-list'", function (done) {
			validators.insideList([ 1, 2, 3 ])([], checkValidation(done, 'outside-list'));
		});
		describe("if custom-error is defined", function () {
			it("should not pass [] with 'custom-error'", function (done) {
				validators.insideList([ 1, 2, 3 ], 'custom-error')([], checkValidation(done, 'custom-error'));
			});
		});
	});


	describe("outsideList([ 1, 2, 3 ])", function () {
		it("should pass 4", function (done) {
			validators.outsideList([ 1, 2, 3 ])(4, checkValidation(done));
		});
		it("should pass -2", function (done) {
			validators.outsideList([ 1, 2, 3 ])(-2, checkValidation(done));
		});
		it("should pass ''", function (done) {
			validators.outsideList([ 1, 2, 3 ])('', checkValidation(done));
		});
		it("should pass null", function (done) {
			validators.outsideList([ 1, 2, 3 ])(null, checkValidation(done));
		});
		it("should pass '2'", function (done) {
			validators.outsideList([ 1, 2, 3 ])('2', checkValidation(done));
		});
		it("should not pass 2 with 'inside-list'", function (done) {
			validators.outsideList([ 1, 2, 3 ])(2, checkValidation(done, 'inside-list'));
		});
		describe("if custom-error is defined", function () {
			it("should not pass 2 with 'custom-error'", function (done) {
				validators.outsideList([ 1, 2, 3 ], 'custom-error')(2, checkValidation(done, 'custom-error'));
			});
		});
	});


	describe("notEmptyString()", function () {
		it("should pass 'a'", function (done) {
			validators.notEmptyString()('a', checkValidation(done));
		});
		it("should not pass '' with 'empty-string'", function (done) {
			validators.notEmptyString()('', checkValidation(done, 'empty-string'));
		});
		describe("if custom-error is defined", function () {
			it("should not pass '' with 'custom-error'", function (done) {
				validators.notEmptyString('custom-error')('', checkValidation(done, 'custom-error'));
			});
		});
		it("should not pass undef with 'undefined'", function (done) {
			validators.notEmptyString()(undef, checkValidation(done, 'undefined'));
		});
		describe("if custom-error is defined", function () {
			it("should not pass '' with 'custom-error'", function (done) {
				validators.notEmptyString('custom-error')('', checkValidation(done, 'custom-error'));
			});
		});
	});


	describe("equalToProperty('name')", function () {
		it("should pass if equal", function (done) {
			validators.equalToProperty('name')('John Doe', checkValidation(done), { name: "John Doe" });
		});
		it("should not pass if not equal", function (done) {
			validators.equalToProperty('name')('John Doe', checkValidation(done, 'not-equal-to-property'), { name: "John" });
		});
		it("should not pass even if equal to other property", function (done) {
			validators.equalToProperty('name')('John Doe', checkValidation(done, 'not-equal-to-property'), { surname: "John Doe" });
		});
	});


	describe("unique()", function () {
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
				err.should.have.property("field", "surname");
				err.should.have.property("value", "Doe");
				err.should.have.property("msg", "not-unique");

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


	describe("password()", function () {
		it("should pass 'Passw0r∂'", function (done) {
			validators.password()('Passw0r∂', checkValidation(done));
		});
		it("should not pass 'password' with 'weak-password'", function (done) {
			validators.password()('password', checkValidation(done, 'weak-password'));
		});
		it("should not pass 'Passw0rd' with 'weak-password'", function (done) {
			validators.password()('Passw0rd', checkValidation(done, 'weak-password'));
		});
	});


	describe("password('ln4', 'bad-pwd')", function () {
		it("should pass 'Passw0r∂'", function (done) {
			validators.password('ln4', 'bad-pwd')('Passw0r∂', checkValidation(done));
		});
		it("should pass 'Passw0rd'", function (done) {
			validators.password('ln4', 'bad-pwd')('Passw0rd', checkValidation(done));
		});
		it("should not pass 'P12345' with 'bad-pwd'", function (done) {
			validators.password('ln4', 'bad-pwd')('P12345', checkValidation(done, 'bad-pwd'));
		});
		it("should not pass 'password' with 'bad-pwd'", function (done) {
			validators.password('ln4', 'bad-pwd')('password', checkValidation(done, 'bad-pwd'));
		});
		it("should not pass 'p12' with 'bad-pwd'", function (done) {
			validators.password('ln4', 'bad-pwd')('p12', checkValidation(done, 'bad-pwd'));
		});
	});


	describe("patterns.hexString()", function () {
		it("should pass 'ABCDEF0123456789'", function (done) {
			validators.patterns.hexString()('ABCDEF0123456789', checkValidation(done));
		});
		it("should pass 'abcdef0123456789'", function (done) {
			validators.patterns.hexString()('abcdef0123456789', checkValidation(done));
		});
		it("should not pass 'af830g'", function (done) {
			validators.patterns.hexString()('af830g', checkValidation(done, 'no-pattern-match'));
		});
		it("should not pass ''", function (done) {
			validators.patterns.hexString()('', checkValidation(done, 'no-pattern-match'));
		});
	});


	describe("patterns.email()", function () {
		// Source: http://en.wikipedia.org/wiki/Email_address
		//
		it("should pass 'niceandsimple@example.com'", function (done) {
			validators.patterns.email()('niceandsimple@example.com', checkValidation(done));
		});
		it("should pass 'Very.Common@example.com'", function (done) {
			validators.patterns.email()('Very.Common@example.com', checkValidation(done));
		});
		it("should pass 'disposable.style.email.with+symbol@example.com'", function (done) {
			validators.patterns.email()('disposable.style.email.with+symbol@example.com', checkValidation(done));
		});
		it("should not pass 'Abc.example.com'", function (done) {
			validators.patterns.email()('Abc.example.com', checkValidation(done, 'no-pattern-match'));
		});
		it("should not pass 'A@b@c@example.com'", function (done) {
			validators.patterns.email()('A@b@c@example.com', checkValidation(done, 'no-pattern-match'));
		});
		it("should not pass 'not\\allowed@example.com'", function (done) {
			validators.patterns.email()('not\\allowed@example.com', checkValidation(done, 'no-pattern-match'));
		});
		it("should not pass 'abc@example'", function (done) {
			validators.patterns.email()('abc@example', checkValidation(done, 'no-pattern-match'));
		});
	});


	describe("patterns.ipv4()", function () {
		it("should pass '1.2.3.4'", function (done) {
			validators.patterns.ipv4()('1.2.3.4', checkValidation(done));
		});
		it("should pass '1.0.0.1'", function (done) {
			validators.patterns.ipv4()('1.0.0.1', checkValidation(done));
		});
		it("should pass '1.10.100.254'", function (done) {
			validators.patterns.ipv4()('1.10.100.254', checkValidation(done));
		});
		it("should not pass '1.10.100.255'", function (done) {
			validators.patterns.ipv4()('1.10.100.255', checkValidation(done, 'no-pattern-match'));
		});
		it("should not pass '1.10.100.0'", function (done) {
			validators.patterns.ipv4()('1.10.100.0', checkValidation(done, 'no-pattern-match'));
		});
		it("should not pass '0.1.2.3'", function (done) {
			validators.patterns.ipv4()('0.1.2.3', checkValidation(done, 'no-pattern-match'));
		});
	});
});
