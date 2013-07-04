var should   = require('should');
var helper   = require('../support/spec_helper');
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
			});
			Person.hasMany("parents");

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

	describe(".each()", function () {
		before(setup());

		it("should return a ChainFind", function (done) {
			var chain = Person.find({ age: 22 }).each();

			chain.should.be.a("object");
			chain.filter.should.be.a("function");
			chain.sort.should.be.a("function");
			chain.count.should.be.a("function");
			chain.get.should.be.a("function");
			chain.save.should.be.a("function");

			return done();
		});

		describe(".count()", function () {
			it("should return the total filtered items", function (done) {
				Person.find().each().filter(function (person) {
					return (person.age > 18);
				}).count(function (count) {
					count.should.equal(1);

					return done();
				});
			});
		});

		describe(".sort()", function () {
			it("should return the items sorted using the sorted function", function (done) {
				Person.find().each().sort(function (first, second) {
					return (first.age < second.age);
				}).get(function (people) {
					should(Array.isArray(people));

					people.length.should.equal(3);
					people[0].age.should.equal(20);
					people[2].age.should.equal(18);

					return done();
				});
			});
		});

		describe(".save()", function () {
			it("should save items after changes", function (done) {
				Person.find({ surname: "Dean" }).each(function (person) {
					person.age.should.not.equal(45);
					person.age = 45;
				}).save(function () {
					Person.find({ surname: "Dean" }, function (err, people) {
						should(Array.isArray(people));

						people.length.should.equal(1);
						people[0].age.should.equal(45);

						return done();
					});
				});
			});
		});

		describe("if passing a callback", function () {
			it("should use it to .forEach()", function (done) {
				Person.find({ surname: "Dean" }).each(function (person) {
					person.fullName = person.name + " " + person.surname;
				}).get(function (people) {
					should(Array.isArray(people));

					people.length.should.equal(1);
					people[0].fullName = "Jane Dean";

					return done();
				});
			});
		});

		describe(".hasAccessor() for hasOne associations", function () {
			it("should be chainable", function (done) {
				Person.find({ name: "John" }, function (err, John) {
					should.equal(err, null);

					var Justin = new Person({
						name : "Justin",
						age  : 45
					});

					John[0].setParents([ Justin ], function (err) {
						should.equal(err, null);

						Person.find().hasParents(Justin.id).all(function (err, people) {
							should.equal(err, null);

							should(Array.isArray(people));

							people.length.should.equal(1);
							people[0].name.should.equal("John");

							return done();
						});
					});
				});
			});
		});
	});
});
