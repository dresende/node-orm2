var should   = require('should');
var ORMError = require('../../lib/Error');
var path     = require('path');

describe("Error", function () {
	describe("constructor", function () {
		it("should inherit from native Error", function () {
			var e = new ORMError("Test message", 'PARAM_MISMATCH');
			should(e instanceof Error);
		});

		it("should have a valid stack", function () {
			try {
				throw new ORMError("Test message", 'PARAM_MISMATCH');
			} catch (e) {
				var stackArr = e.stack.split('\n');
				// [0] is ''
				should(stackArr[1].indexOf(path.join('test', 'integration', 'error_spec.js')) > 0);
			}
		});

		it("should have the right name", function () {
			var e = new ORMError("Test message", 'PARAM_MISMATCH');
			should.equal(e.name, 'ORMError');
		});

		it("should throw on invalid code", function () {
			(function () {
				var e = new ORMError("Test message", 'FLYING_SQUIRRELS');
			}).should.throw("Invalid error code: FLYING_SQUIRRELS");
		});

		it("should assign the code", function () {
			var e = new ORMError("Test message", 'PARAM_MISMATCH');
			should.equal(e.code, 6);
		});

		it("should assign literal code", function () {
			var e = new ORMError("Test message", 'PARAM_MISMATCH');
			should.equal(e.literalCode, 'PARAM_MISMATCH');
		});

		it("should assign extra params", function () {
			var e = new ORMError("Test message", 'PARAM_MISMATCH', { details: "something" });
			should.equal(e.details, "something");
		});

		it("should stringify nicely", function () {
			var e = new ORMError("Test message", 'PARAM_MISMATCH');
			should.equal(e.toString(), "[ORMError PARAM_MISMATCH: Test message]");
		});
	});

	describe("codes", function () {
		it("should be exposed", function () {
			should.exist(ORMError.codes);
			should.equal(ORMError.codes['NOT_FOUND'], 2);
		});
	});
});
