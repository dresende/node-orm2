var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');
var protocol = common.protocol();

describe("Model.get()", function() {
	var db     = null;
	var Person = null;
	var John;

	var setup = function (cache) {
		return function (done) {
			Person = db.define("person", {
				name   : { type: 'text', mapsTo: 'fullname' }
			}, {
				cache  : cache,
				methods: {
					UID: function () {
						return this[Person.id];
					}
				}
			});

			ORM.singleton.clear(); // clear cache

			return helper.dropSync(Person, function () {
				Person.create([{
					name: "John Doe"
				}, {
					name: "Jane Doe"
				}], function (err, people) {
					John = people[0];

					return done();
				});
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

	describe("mapsTo", function () {
		if (protocol == 'mongodb') return;

		before(setup(true));

		it("should create the table with a different column name than property name", function (done) {
			var sql;

			if (protocol == 'sqlite') {
				sql = "PRAGMA table_info(?)";
			} else {
				sql = "SELECT column_name FROM information_schema.columns WHERE table_name = ?";
			}

			db.driver.execQuery(sql, [Person.table], function (err, data) {
				should.not.exist(err);

				var names = _.pluck(data, protocol == 'sqlite' ? 'name' : 'column_name')

				should.equal(typeof Person.properties.name, 'object');
				should.notEqual(names.indexOf('fullname'), -1);

				done();
			});
		});
	});

	describe("with cache", function () {
		before(setup(true));

		it("should return item with id 1", function (done) {
			Person.get(John[Person.id], function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");
				John.should.have.property(Person.id, John[Person.id]);
				John.should.have.property("name", "John Doe");

				return done();
			});
		});

		it("should have an UID method", function (done) {
			Person.get(John[Person.id], function (err, John) {
				should.equal(err, null);

				John.UID.should.be.a("function");
				John.UID().should.equal(John[Person.id]);

				return done();
			});
		});

		describe("changing name and getting id 1 again", function () {
			it("should return the original object with unchanged name", function (done) {
				Person.get(John[Person.id], function (err, John1) {
					should.equal(err, null);

					John1.name = "James";

					Person.get(John[Person.id], function (err, John2) {
						should.equal(err, null);

						John1[Person.id].should.equal(John2[Person.id]);
						John2.name.should.equal("John Doe");

						return done();
					});
				});
			});
		});

		describe("changing instance.cacheSaveCheck = false", function () {
			before(function (done) {
				Person.settings.set("instance.cacheSaveCheck", false);

				it("should return the same object with the changed name", function (done) {
					Person.get(John[Person.id], function (err, John1) {
						should.equal(err, null);

						John1.name = "James";

						Person.get(John[Person.id], function (err, John2) {
							should.equal(err, null);

							John1[Person.id].should.equal(John2[Person.id]);
							John2.name.should.equal("James");

							return done();
						});
					});
				});
			});
		});
	});

	describe("with no cache", function () {
		before(setup(false));

		describe("fetching several times", function () {
			it("should return different objects", function (done) {
				Person.get(John[Person.id], function (err, John1) {
					should.equal(err, null);
					Person.get(John[Person.id], function (err, John2) {
						should.equal(err, null);

						John1[Person.id].should.equal(John2[Person.id]);
						John1.should.not.equal(John2);

						return done();
					});
				});
			});
		});
	});

	describe("with cache = 0.5 secs", function () {
		before(setup(0.5));

		describe("fetching again after 0.2 secs", function () {
			it("should return same objects", function (done) {
				Person.get(John[Person.id], function (err, John1) {
					should.equal(err, null);

					setTimeout(function () {
						Person.get(John[Person.id], function (err, John2) {
							should.equal(err, null);

							John1[Person.id].should.equal(John2[Person.id]);
							John1.should.equal(John2);

							return done();
						});
					}, 200);
				});
			});
		});

		describe("fetching again after 0.7 secs", function () {
			it("should return different objects", function (done) {
				Person.get(John[Person.id], function (err, John1) {
					should.equal(err, null);

					setTimeout(function () {
						Person.get(John[Person.id], function (err, John2) {
							should.equal(err, null);

							John1.should.not.equal(John2);

							return done();
						});
					}, 700);
				});
			});
		});
	});

	describe("with empty object as options", function () {
		before(setup());

		it("should return item with id 1 like previously", function (done) {
			Person.get(John[Person.id], {}, function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");
				John.should.have.property(Person.id, John[Person.id]);
				John.should.have.property("name", "John Doe");

				return done();
			});
		});
	});

	describe("without callback", function () {
		before(setup(true));

		it("should throw", function (done) {
			(function () {
				Person.get(John[Person.id]);
			}).should.throw();

			return done();
		});
	});

	describe("when not found", function () {
		before(setup(true));

		it("should return an error", function (done) {
			Person.get(999, function (err) {
				err.should.be.a("object");
				err.message.should.equal("Not found");

				return done();
			});
		});
	});

	describe("if passed an Array with ids", function () {
		before(setup(true));

		it("should accept and try to fetch", function (done) {
			Person.get([ John[Person.id] ], function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");
				John.should.have.property(Person.id, John[Person.id]);
				John.should.have.property("name", "John Doe");

				return done();
			});
		});
	});

	describe("if passed a wrong number of ids", function () {
		before(setup(true));

		it("should throw", function (done) {
			(function () {
				Person.get(1, 2, function () {});
			}).should.throw();

			return done();
		});
	});

	describe("if primary key name is changed", function () {
		before(function (done) {
			Person = db.define("person", {
				name : String
			});

			ORM.singleton.clear();

			return helper.dropSync(Person, function () {
				Person.create([{
					name : "John Doe"
				}, {
					name : "Jane Doe"
				}], done);
			});
		});

		it("should search by key name and not 'id'", function (done) {
			db.settings.set('properties.primary_key', 'name');

			var OtherPerson = db.define("person", {
				id : Number
			});

			OtherPerson.get("Jane Doe", function (err, person) {
				should.equal(err, null);

				person.name.should.equal("Jane Doe");

				return done();
			});
		});
	});

	describe("with a point property type", function() {
		if (common.protocol() == 'sqlite' || common.protocol() == 'mongodb') return;

		it("should deserialize the point to an array", function (done) {
			db.settings.set('properties.primary_key', 'id');

			Person = db.define("person", {
				name     : String,
				location : { type: "point" }
			});

			ORM.singleton.clear();

			return helper.dropSync(Person, function () {
				Person.create({
					name     : "John Doe",
					location : { x : 51.5177, y : -0.0968 }
				}, function (err, person) {
					should.equal(err, null);

					person.location.should.be.an.instanceOf(Object);
					person.location.should.have.property('x', 51.5177);
					person.location.should.have.property('y', -0.0968);
					return done();
				});
			});
		});
	});
});
