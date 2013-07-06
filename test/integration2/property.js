var should   = require('should');
var ORM      = require("../..");
var Property = ORM.Property;

describe("Property", function () {
	describe("passing String", function() {
		it("should return type: 'text'", function (done) {
			Property.normalize(String, ORM.settings).type.should.equal("text");

			return done();
		});
	});
	describe("passing Number", function() {
		it("should return type: 'number'", function (done) {
			Property.normalize(Number, ORM.settings).type.should.equal("number");

			return done();
		});
	});
	describe("passing Boolean", function() {
		it("should return type: 'boolean'", function (done) {
			Property.normalize(Boolean, ORM.settings).type.should.equal("boolean");

			return done();
		});
	});
	describe("passing Date", function() {
		it("should return type: 'date'", function (done) {
			Property.normalize(Date, ORM.settings).type.should.equal("date");

			return done();
		});
	});
	describe("passing Object", function() {
		it("should return type: 'object'", function (done) {
			Property.normalize(Object, ORM.settings).type.should.equal("object");

			return done();
		});
	});
	describe("passing Buffer", function() {
		it("should return type: 'binary'", function (done) {
			Property.normalize(Buffer, ORM.settings).type.should.equal("binary");

			return done();
		});
	});
	describe("passing an Array of items", function() {
		it("should return type: 'enum' with list of items", function (done) {
			var prop = Property.normalize([ 1, 2, 3 ], ORM.settings);

			prop.type.should.equal("enum");
			prop.values.should.have.property("length", 3);

			return done();
		});
	});
	describe("passing a string type", function() {
		it("should return type: <type>", function (done) {
			Property.normalize("text", ORM.settings).type.should.equal("text");

			return done();
		});
    it("should accept: 'point'", function(done) {
      Property.normalize("point", ORM.settings).type.should.equal("point");
      
      return done();
    });

		describe("if not valid", function () {
			it("should throw", function (done) {
				(function () {
					Property.normalize("string", ORM.settings);
				}).should.throw();

				return done();
			});
		});
	});
});
