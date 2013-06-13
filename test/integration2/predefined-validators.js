var should     = require('should');
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
