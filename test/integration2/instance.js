var should	 = require('should');
var helper	 = require('../support/spec_helper');
var ORM			= require('../../');

describe("Model instance", function() {
	var db = null;
	var Person = null;

	var setup = function () {
		return function (done) {
			db.settings.set('instance.returnAllErrors', true);

			Person = db.define("person", {
				name : String,
				age  : { type: 'number', rational: false, required: false }
			}, {
				validations: {
					age: ORM.validators.rangeNumber(0, 150)
				}
			});

			return helper.dropSync(Person, function () {
				Person.create([{
					id	: 1,
					name: "Jeremy Doe"
				}, {
					id	: 2,
					name: "John Doe"
				}, {
					id	: 3,
					name: "Jane Doe"
				}], done);
			});
		};
	};

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			setup()(function (err) {
				return done();
			});
		});
	});

	after(function () {
		return db.close();
	});

	describe("#isInstance", function () {
		it("should always return true for instances", function (done) {
			should.equal((new Person).isInstance, true);
			should.equal((Person(4)).isInstance, true);
			Person.get(2, function (err, item) {
				should.not.exist(err);
				should.equal(item.isInstance, true);
				return done();
			});
		});

		it("should be false for all other objects", function () {
			should.notEqual({}.isInstance, true);
			should.notEqual([].isInstance, true);
		});
	});

	describe("#isPersisted", function () {
		it("should return true for persisted instances", function (done) {
			Person.get(2, function (err, item) {
				should.not.exist(err);
				should.equal(item.isPersisted(), true);
				return done();
			});
		});

		it("should return true for shell instances", function () {
			should.equal(Person(4).isPersisted(), true);
		});

		it("should return false for new instances", function () {
			should.equal((new Person).isPersisted(), false);
		});
	});

	describe("#isShell", function () {
		it("should return true for shell models", function () {
			should.equal(Person(4).isShell(), true);
		});

		it("should return false for new models", function () {
			should.equal((new Person).isShell(), false);
		});

		it("should return false for existing models", function (done) {
			Person.get(2, function (err, item) {
				should.not.exist(err);
				should.equal(item.isShell(), false);
				return done();
			});
		});
	});

	describe("#validate", function () {
		it("should return validation errors if invalid", function (done) {
			var person = new Person({ age: -1 });

			person.validate(function (err, validationErrors) {
				should.not.exist(err);
				should.equal(Array.isArray(validationErrors), true);

				return done();
			});
		});

		it("should return false if valid", function (done) {
			var person = new Person({ name: 'Janette' });

			person.validate(function (err, validationErrors) {
				should.not.exist(err);
				should.equal(validationErrors, false);

				return done();
			});
		});
	});
});
