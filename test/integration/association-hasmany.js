var should = require('should');
var helper = require('../support/spec_helper');
var ORM    = require('../../');
var common = require('../common');

describe("hasMany", function () {
	this.timeout(4000);
	var db     = null;
	var Person = null;
	var Pet    = null;

	var setup = function (opts) {
		opts = opts || {};
		return function (done) {
			db.settings.set('instance.cache', false);

			Person = db.define('person', {
				name    : String,
				surname : String,
				age     : Number
			}, opts);
			Pet = db.define('pet', {
				name    : String
			});
			Person.hasMany('pets', Pet);

			return helper.dropSync([ Person, Pet ], function () {
				/**
				 * John --+---> Deco
				 *        '---> Mutt <----- Jane
				 *
				 * Justin
				 */
				Person.create([{
					name    : "John",
					surname : "Doe",
					age     : 20,
					pets    : [{
						name    : "Deco"
					}, {
						name    : "Mutt"
					}]
				}, {
					name    : "Jane",
					surname : "Doe",
					age     : 16
				}, {
					name    : "Justin",
					surname : "Dean",
					age     : 18
				}], function (err) {
					Person.find({ name: "Jane" }, function (err, people) {
						Pet.find({ name: "Mutt" }, function (err, pets) {
							people[0].addPets(pets, done);
						});
					});
				});
			});
		};
	};

	before(function(done) {
		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

	describe("getAccessor", function () {
		before(setup());

		it("should allow to specify order as string", function (done) {
			Person.find({ name: "John" }, function (err, people) {
				should.equal(err, null);

				people[0].getPets("-name", function (err, pets) {
					should.equal(err, null);

					should(Array.isArray(pets));
					pets.length.should.equal(2);
					pets[0].name.should.equal("Mutt");
					pets[1].name.should.equal("Deco");

					return done();
				});
			});
		});

		it("should allow to specify order as Array", function (done) {
			Person.find({ name: "John" }, function (err, people) {
				should.equal(err, null);

				people[0].getPets([ "name", "Z" ], function (err, pets) {
					should.equal(err, null);

					should(Array.isArray(pets));
					pets.length.should.equal(2);
					pets[0].name.should.equal("Mutt");
					pets[1].name.should.equal("Deco");

					return done();
				});
			});
		});

		it("should allow to specify a limit", function (done) {
			Person.find({ name: "John" }).first(function (err, John) {
				should.equal(err, null);

				John.getPets(1, function (err, pets) {
					should.equal(err, null);

					should(Array.isArray(pets));
					pets.length.should.equal(1);

					return done();
				});
			});
		});

		it("should allow to specify conditions", function (done) {
			Person.find({ name: "John" }).first(function (err, John) {
				should.equal(err, null);

				John.getPets({ name: "Mutt" }, function (err, pets) {
					should.equal(err, null);

					should(Array.isArray(pets));
					pets.length.should.equal(1);
					pets[0].name.should.equal("Mutt");

					return done();
				});
			});
		});

		if (common.protocol() == "mongodb") return;

		it("should return a chain if no callback defined", function (done) {
			Person.find({ name: "John" }, function (err, people) {
				should.equal(err, null);

				var chain = people[0].getPets({ name: "Mutt" });

				chain.should.be.a("object");
				chain.find.should.be.a("function");
				chain.only.should.be.a("function");
				chain.limit.should.be.a("function");
				chain.order.should.be.a("function");

				return done();
			});
		});
	});

	describe("hasAccessor", function () {
		before(setup());

		it("should return true if instance has associated item", function (done) {
			Pet.find({ name: "Mutt" }, function (err, pets) {
				should.equal(err, null);

				Person.find({ name: "Jane" }).first(function (err, Jane) {
					should.equal(err, null);

					Jane.hasPets(pets[0], function (err, has_pets) {
						should.equal(err, null);
						has_pets.should.be.true;

						return done();
					});
				});
			});
		});

		it("should return true if not passing any instance and has associated items", function (done) {
			Person.find({ name: "Jane" }).first(function (err, Jane) {
				should.equal(err, null);

				Jane.hasPets(function (err, has_pets) {
					should.equal(err, null);
					has_pets.should.be.true;

					return done();
				});
			});
		});

		it("should return true if all passed instances are associated", function (done) {
			Pet.find(function (err, pets) {
				Person.find({ name: "John" }).first(function (err, John) {
					should.equal(err, null);

					John.hasPets(pets, function (err, has_pets) {
						should.equal(err, null);
						has_pets.should.be.true;

						return done();
					});
				});
			});
		});

		it("should return false if any passed instances are not associated", function (done) {
			Pet.find(function (err, pets) {
				Person.find({ name: "Jane" }).first(function (err, Jane) {
					should.equal(err, null);

					Jane.hasPets(pets, function (err, has_pets) {
						should.equal(err, null);
						has_pets.should.be.false;

						return done();
					});
				});
			});
		});
	});

	describe("delAccessor", function () {
		before(setup());

		it("should accept arguments in different orders", function (done) {
			Pet.find({ name: "Mutt" }, function (err, pets) {
				Person.find({ name: "John" }, function (err, people) {
					should.equal(err, null);

					people[0].removePets(function (err) {
						should.equal(err, null);

						people[0].getPets(function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(1);
							pets[0].name.should.equal("Deco");

							return done();
						});
					}, pets[0]);
				});
			});
		});
	});

	describe("delAccessor", function () {
		before(setup());

		it("should remove specific associations if passed", function (done) {
			Pet.find({ name: "Mutt" }, function (err, pets) {
				Person.find({ name: "John" }, function (err, people) {
					should.equal(err, null);

					people[0].removePets(pets[0], function (err) {
						should.equal(err, null);

						people[0].getPets(function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(1);
							pets[0].name.should.equal("Deco");

							return done();
						});
					});
				});
			});
		});

		it("should remove all associations if none passed", function (done) {
			Person.find({ name: "John" }).first(function (err, John) {
				should.equal(err, null);

				John.removePets(function (err) {
					should.equal(err, null);

					John.getPets(function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(0);

						return done();
					});
				});
			});
		});
	});

	describe("addAccessor", function () {
		before(setup());

		if (common.protocol() == "mongodb") return;

		it("might add duplicates", function (done) {
			Pet.find({ name: "Mutt" }, function (err, pets) {
				Person.find({ name: "Jane" }, function (err, people) {
					should.equal(err, null);

					people[0].addPets(pets[0], function (err) {
						should.equal(err, null);

						people[0].getPets("name", function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(2);
							pets[0].name.should.equal("Mutt");
							pets[1].name.should.equal("Mutt");

							return done();
						});
					});
				});
			});
		});
	});

	describe("addAccessor", function () {
		before(setup());

		it("should keep associations and add new ones", function (done) {
			Pet.find({ name: "Deco" }).first(function (err, Deco) {
				Person.find({ name: "Jane" }).first(function (err, Jane) {
					should.equal(err, null);

					Jane.addPets(Deco, function (err) {
						should.equal(err, null);

						Jane.getPets("name", function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(2);
							pets[0].name.should.equal("Deco");
							pets[1].name.should.equal("Mutt");

							return done();
						});
					});
				});
			});
		});
	});

	describe("addAccessor", function () {
		before(setup());

		it("should accept several arguments as associations", function (done) {
			Pet.find(function (err, pets) {
				Person.find({ name: "Justin" }).first(function (err, Justin) {
					should.equal(err, null);

					Justin.addPets(pets[0], pets[1], function (err) {
						should.equal(err, null);

						Justin.getPets(function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(2);

							return done();
						});
					});
				});
			});
		});
	});

	describe("addAccessor", function () {
		before(setup());

		it("should accept array as list of associations", function (done) {
			Pet.find(function (err, pets) {
				Person.find({ name: "Justin" }).first(function (err, Justin) {
					should.equal(err, null);

					Justin.addPets(pets, function (err) {
						should.equal(err, null);

						Justin.getPets(function (err, all_pets) {
							should.equal(err, null);

							should(Array.isArray(all_pets));
							all_pets.length.should.equal(pets.length);

							return done();
						});
					});
				});
			});
		});
	});

	describe("setAccessor", function () {
		before(setup());

		it("clears current associations", function (done) {
			Pet.find({ name: "Deco" }, function (err, pets) {
				var Deco = pets[0];

				Person.find({ name: "Jane" }).first(function (err, Jane) {
					should.equal(err, null);

					Jane.getPets(function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(1);
						pets[0].name.should.equal("Mutt");

						Jane.setPets(Deco, function (err) {
							should.equal(err, null);

							Jane.getPets(function (err, pets) {
								should.equal(err, null);

								should(Array.isArray(pets));
								pets.length.should.equal(1);
								pets[0].name.should.equal(Deco.name);

								return done();
							});
						});
					});
				});
			});
		});
	});

	describe("setAccessor", function () {
		before(setup());

		it("should accept several arguments as associations", function (done) {
			Pet.find(function (err, pets) {
				Person.find({ name: "Justin" }).first(function (err, Justin) {
					should.equal(err, null);

					Justin.setPets(pets[0], pets[1], function (err) {
						should.equal(err, null);

						Justin.getPets(function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(2);

							return done();
						});
					});
				});
			});
		});

		it("should accept an array of associations", function (done) {
			Pet.find(function (err, pets) {
				Person.find({ name: "Justin" }).first(function (err, Justin) {
					should.equal(err, null);

					Justin.setPets(pets, function (err) {
						should.equal(err, null);

						Justin.getPets(function (err, all_pets) {
							should.equal(err, null);

							should(Array.isArray(all_pets));
							all_pets.length.should.equal(pets.length);

							return done();
						});
					});
				});
			});
		});

		it("should throw if no items passed", function (done) {
			Person.one(function (err, person) {
				should.equal(err, null);

				(function () {
					person.addPets(function () {});
				}).should.throw();

				return done();
			});
		});
	});

	describe("with autoFetch turned on", function () {
		before(setup({
			autoFetch : true
		}));

		it("should fetch associations", function (done) {
			Person.find({ name: "John" }).first(function (err, John) {
				should.equal(err, null);

				John.should.have.property("pets");
				should(Array.isArray(John.pets));
				John.pets.length.should.equal(2);

				return done();
			});
		});
	});
});
