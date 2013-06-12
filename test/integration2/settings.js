var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var async    = require('async');
var ORM      = require('../../');

describe("Settings", function () {
	var testFunction = function testFunction() {
		return "test";
	};

	describe("some.sub.object = 123.45", function () {
		before(function (done) {
			ORM.settings.set("some.sub.object", 123.45);
			return done();
		});

		it("should be 123.45", function (done) {
			ORM.settings.get("some.sub.object").should.equal(123.45);

			return done();
		});
	});

	describe("some....object = testFunction", function () {
		before(function (done) {
			ORM.settings.set("some....object", testFunction);
			return done();
		});

		it("should be testFunction", function (done) {
			ORM.settings.get("some....object").should.equal(testFunction);

			return done();
		});
	});

	describe("not setting some.unknown.object", function () {
		it("should be undefined", function (done) {
			should.equal(ORM.settings.get("some.unknown.object"), undefined);

			return done();
		});
	});

	describe("unsetting some.sub.object", function () {
		before(function (done) {
			ORM.settings.unset("some.sub.object");
			return done();
		});

		it("should be undefined", function (done) {
			should.equal(ORM.settings.get("some.sub.object"), undefined);

			return done();
		});
	});

	describe("unsetting some....object", function () {
		before(function (done) {
			ORM.settings.unset("some....object");
			return done();
		});

		it("should be undefined", function (done) {
			should.equal(ORM.settings.get("some....object"), undefined);

			return done();
		});
	});

	describe("unsetting some.*", function () {
		before(function (done) {
			ORM.settings.unset("some.*");
			return done();
		});

		it("should return undefined for any 'some' sub-element", function (done) {
			should.equal(ORM.settings.get("some.other.stuff"), undefined);

			return done();
		});
		it("should return an empty object for some.*", function (done) {
			ORM.settings.get("some.*").should.be.a("object");
			Object.keys(ORM.settings.get("some.*")).should.have.lengthOf(0);

			return done();
		});
		it("should return an empty object for some", function (done) {
			ORM.settings.get("some").should.be.a("object");
			Object.keys(ORM.settings.get("some")).should.have.lengthOf(0);

			return done();
		});
	});
});
