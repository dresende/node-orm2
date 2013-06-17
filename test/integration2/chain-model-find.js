var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var async    = require('async');
var ORM      = require('../../');

describe("Model.find() chaining", function() {
	var db = null;
	var Person = null;

	var setup = function () {
		return function (done) {
			Person = db.define("person", {
				name    : String,
				surname : String,
				age     : Number
			}, {
				cache : false
			});

			ORM.singleton.clear(); // clear cache

			return helper.dropSync(Person, function () {
				Person.create([{
					name    : "John",
					surname : "Doe",
					age     : 18
				}, {
					name    : "Jane",
					surname : "Doe",
					age     : 20
				}, {
					name    : "Jane",
					surname : "Dean",
					age     : 18
				}], done);
			});
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

	describe(".limit(N)", function () {
		before(setup());

		it("should limit results to N items", function (done) {
			Person.find().limit(2).run(function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 2);

				return done();
			});
		});
	});

	describe(".skip(N)", function () {
		before(setup());

		it("should skip the first N results", function (done) {
			Person.find().skip(2).order("age").run(function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 1);
				instances[0].age.should.equal(20);

				return done();
			});
		});
	});

	describe(".offset(N)", function () {
		before(setup());

		it("should skip the first N results", function (done) {
			Person.find().offset(2).order("age").run(function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 1);
				instances[0].age.should.equal(20);

				return done();
			});
		});
	});

	describe(".order('property')", function () {
		before(setup());

		it("should order by that property ascending", function (done) {
			Person.find().order("age").run(function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 3);
				instances[0].age.should.equal(18);
				instances[2].age.should.equal(20);

				return done();
			});
		});
	});

	describe(".order('-property')", function () {
		before(setup());

		it("should order by that property descending", function (done) {
			Person.find().order("-age").run(function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 3);
				instances[0].age.should.equal(20);
				instances[2].age.should.equal(18);

				return done();
			});
		});
	});

	describe(".order('property', 'Z')", function () {
		before(setup());

		it("should order by that property descending", function (done) {
			Person.find().order("age", "Z").run(function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 3);
				instances[0].age.should.equal(20);
				instances[2].age.should.equal(18);

				return done();
			});
		});
	});

	describe(".only('property', ...)", function () {
		before(setup());

		it("should return only those properties, others null", function (done) {
			Person.find().only("age", "surname").order("-age").run(function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 3);
				instances[0].should.have.property("age");
				instances[0].should.have.property("surname", "Doe");
				instances[0].should.have.property("name", null);

				return done();
			});
		});
	});

	describe(".only('property1', ...)", function () {
		before(setup());

		it("should return only those properties, others null", function (done) {
			Person.find().only([ "age", "surname" ]).order("-age").run(function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 3);
				instances[0].should.have.property("age");
				instances[0].should.have.property("surname", "Doe");
				instances[0].should.have.property("name", null);

				return done();
			});
		});
	});

	describe(".count()", function () {
		before(setup());

		it("should return only the total number of results", function (done) {
			Person.find().count(function (err, count) {
				should.equal(err, null);
				count.should.equal(3);

				return done();
			});
		});
	});

	describe(".first()", function () {
		before(setup());

		it("should return only the first element", function (done) {
			Person.find().order("-age").first(function (err, JaneDoe) {
				should.equal(err, null);

				JaneDoe.name.should.equal("Jane");
				JaneDoe.surname.should.equal("Doe");
				JaneDoe.age.should.equal(20);

				return done();
			});
		});

		it("should return null if not found", function (done) {
			Person.find({ name: "Jack" }).first(function (err, Jack) {
				should.equal(err, null);
				should.equal(Jack, null);

				return done();
			});
		});
	});

	describe(".last()", function () {
		before(setup());

		it("should return only the last element", function (done) {
			Person.find().order("age").last(function (err, JaneDoe) {
				should.equal(err, null);

				JaneDoe.name.should.equal("Jane");
				JaneDoe.surname.should.equal("Doe");
				JaneDoe.age.should.equal(20);

				return done();
			});
		});

		it("should return null if not found", function (done) {
			Person.find({ name: "Jack" }).last(function (err, Jack) {
				should.equal(err, null);
				should.equal(Jack, null);

				return done();
			});
		});
	});

	describe(".find()", function () {
		before(setup());

		it("should not change find if no arguments", function (done) {
			Person.find().find().count(function (err, count) {
				should.equal(err, null);
				count.should.equal(3);

				return done();
			});
		});

		it("should restrict conditions if passed", function (done) {
			Person.find().find({ age: 18 }).count(function (err, count) {
				should.equal(err, null);
				count.should.equal(2);

				return done();
			});
		});

		it("should restrict conditions if passed and also be chainable", function (done) {
			Person.find().find({ age: 18 }).find({ name: "Jane" }).count(function (err, count) {
				should.equal(err, null);
				count.should.equal(1);

				return done();
			});
		});

		it("should return results if passed a callback as second argument", function (done) {
			Person.find().find({ age: 18 }, function (err, instances) {
				should.equal(err, null);
				instances.should.have.property("length", 2);

				return done();
			});
		});
	});

	describe(".each()", function () {
		before(setup());

		it("should return a ChainInstance", function (done) {
			var chain = Person.find().each();

			chain.filter.should.be.a("function");
			chain.sort.should.be.a("function");
			chain.count.should.be.a("function");

			return done();
		});
	});

	describe(".remove()", function () {
		before(setup());

		it("should have no problems if no results found", function (done) {
			Person.find({ age: 22 }).remove(function (err) {
				should.equal(err, null);

				Person.find().count(function (err, count) {
					should.equal(err, null);

					count.should.equal(3);

					return done();
				});
			});
		});

		it("should remove results and give feedback", function (done) {
			Person.find({ age: 20 }).remove(function (err) {
				should.equal(err, null);

				Person.find().count(function (err, count) {
					should.equal(err, null);

					count.should.equal(2);

					return done();
				});
			});
		});
	});
});
