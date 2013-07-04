var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.create()", function() {
	var db = null;
	var Pet = null;
	var Person = null;

	var setup = function () {
		return function (done) {
			Person = db.define("person", {
				name   : String
			});
			Pet = db.define("pet", {
				name   : { type: "text", defaultValue: "Mutt" }
			});
			Person.hasMany("pets", Pet);

			return helper.dropSync([ Person, Pet ], done);
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

	describe("if passing an object", function () {
		before(setup());

		it("should accept it as the only item to create", function (done) {
			Person.create({
				name : "John Doe"
			}, function (err, John) {
				should.equal(err, null);
				John.should.have.property("name", "John Doe");

				return done();
			});
		});
	});

	describe("if passing an array", function () {
		before(setup());

		it("should accept it as a list of items to create", function (done) {
			Person.create([{
				name : "John Doe"
			}, {
				name : "Jane Doe"
			}], function (err, people) {
				should.equal(err, null);
				should(Array.isArray(people));

				people.should.have.property("length", 2);
				people[0].should.have.property("name", "John Doe");
				people[1].should.have.property("name", "Jane Doe");

				return done();
			});
		});
	});

	describe("if element has an association", function () {
		before(setup());

		it("should also create it or save it", function (done) {
			Person.create({
				name : "John Doe",
				pets : [ new Pet({ name: "Deco" }) ]
			}, function (err, John) {
				should.equal(err, null);

				John.should.have.property("name", "John Doe");

				should(Array.isArray(John.pets));

				John.pets[0].should.have.property("name", "Deco");
				John.pets[0].should.have.property("id");
				John.pets[0].saved().should.be.true;

				return done();
			});
		});

		it("should also create it or save it even if it's an object and not an instance", function (done) {
			Person.create({
				name : "John Doe",
				pets : [ { name: "Deco" } ]
			}, function (err, John) {
				should.equal(err, null);

				John.should.have.property("name", "John Doe");

				should(Array.isArray(John.pets));

				John.pets[0].should.have.property("name", "Deco");
				John.pets[0].should.have.property("id");
				John.pets[0].saved().should.be.true;

				return done();
			});
		});
	});

	describe("when not passing a property", function () {
		before(setup());

		it("should use defaultValue if defined", function (done) {
			Pet.create({}, function (err, Mutt) {
				should.equal(err, null);

				Mutt.should.have.property("name", "Mutt");

				return done();
			});
		});
	});
});
