var _        = require('lodash');
var should   = require('should');
var Property = require("../../lib/Property");
var Settings = require("../../lib/Settings");

var settings = new Settings.Container({});

describe("Property", function () {
	describe("passing String", function() {
		it("should return type: 'text'", function (done) {
			Property.normalize(String, settings).type.should.equal("text");

			return done();
		});
	});
	describe("passing Number", function() {
		it("should return type: 'number'", function (done) {
			Property.normalize(Number, settings).type.should.equal("number");

			return done();
		});
	});
	describe("passing Boolean", function() {
		it("should return type: 'boolean'", function (done) {
			Property.normalize(Boolean, settings).type.should.equal("boolean");

			return done();
		});
	});
	describe("passing Date", function() {
		it("should return type: 'date'", function (done) {
			Property.normalize(Date, settings).type.should.equal("date");

			return done();
		});
	});
	describe("passing Object", function() {
		it("should return type: 'object'", function (done) {
			Property.normalize(Object, settings).type.should.equal("object");

			return done();
		});
	});
	describe("passing Buffer", function() {
		it("should return type: 'binary'", function (done) {
			Property.normalize(Buffer, settings).type.should.equal("binary");

			return done();
		});
	});
	describe("passing an Array of items", function() {
		it("should return type: 'enum' with list of items", function (done) {
			var prop = Property.normalize([ 1, 2, 3 ], settings);

			prop.type.should.equal("enum");
			prop.values.should.have.property("length", 3);

			return done();
		});
	});
	describe("passing a string type", function() {
		it("should return type: <type>", function (done) {
			Property.normalize("text", settings).type.should.equal("text");

			return done();
		});

		describe("if not valid", function () {
			it("should throw", function (done) {
				(function () {
					Property.normalize("string", settings);
				}).should.throw();

				return done();
			});
		});
	});
});
