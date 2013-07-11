var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var Settings = ORM.Settings;

describe("Settings", function () {
	describe("changed on connection instance", function() {
		it("should not change global defaults", function (done) {
			var setting = 'instance.returnAllErrors';
			var defaultValue = ORM.settings.get(setting);

			helper.connect(function (db) {
				db.settings.set(setting, !defaultValue);
				db.close();

				helper.connect(function (db) {
					db.settings.get(setting).should.equal(defaultValue);
					db.close();
					done();
				});
			});
		});
	});

	describe("#get", function () {
		var settings, returned;

		beforeEach(function () {
			settings = new Settings.Container({ a: [1,2] });
			returned = null;
		});

		it("should clone everything it returns", function () {
			returned = settings.get('*');
			returned.a = 123;

			settings.get('a').should.eql([1,2]);
		});

		it("should deep clone everything it returns", function () {
			returned = settings.get('*');
			returned.a.push(3);

			settings.get('a').should.eql([1,2]);
		});
	});

	describe("manipulating:", function () {
		var testFunction = function testFunction() {
			return "test";
		};
		var settings = new Settings.Container({});

		describe("some.sub.object = 123.45", function () {
			before(function (done) {
				settings.set("some.sub.object", 123.45);
				return done();
			});

			it("should be 123.45", function (done) {
				settings.get("some.sub.object").should.equal(123.45);

				return done();
			});
		});

		describe("some....object = testFunction", function () {
			before(function (done) {
				settings.set("some....object", testFunction);
				return done();
			});

			it("should be testFunction", function (done) {
				settings.get("some....object").should.equal(testFunction);

				return done();
			});
		});

		describe("not setting some.unknown.object", function () {
			it("should be undefined", function (done) {
				should.equal(settings.get("some.unknown.object"), undefined);

				return done();
			});
		});

		describe("unsetting some.sub.object", function () {
			before(function (done) {
				settings.unset("some.sub.object");
				return done();
			});

			it("should be undefined", function (done) {
				should.equal(settings.get("some.sub.object"), undefined);

				return done();
			});
		});

		describe("unsetting some....object", function () {
			before(function (done) {
				settings.unset("some....object");
				return done();
			});

			it("should be undefined", function (done) {
				should.equal(settings.get("some....object"), undefined);

				return done();
			});
		});

		describe("unsetting some.*", function () {
			before(function (done) {
				settings.unset("some.*");
				return done();
			});

			it("should return undefined for any 'some' sub-element", function (done) {
				should.equal(settings.get("some.other.stuff"), undefined);

				return done();
			});
			it("should return an empty object for some.*", function (done) {
				settings.get("some.*").should.be.a("object");
				Object.keys(settings.get("some.*")).should.have.lengthOf(0);

				return done();
			});
			it("should return an empty object for some", function (done) {
				settings.get("some").should.be.a("object");
				Object.keys(settings.get("some")).should.have.lengthOf(0);

				return done();
			});
		});
	});
});
