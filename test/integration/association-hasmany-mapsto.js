var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var common   = require('../common');
var protocol = common.protocol();

if (common.protocol() == "mongodb") return;   // Can't do mapsTo testing on mongoDB ()

describe("hasMany with mapsTo", function () {
	this.timeout(4000);
	var db     = null;
	var Person = null;
	var Pet    = null;

	before(function(done) {
		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

	describe("normal", function () {

		var setup = function (opts) {
			opts = opts || {};

			return function (done) {
				db.settings.set('instance.identityCache', false);

				Person = db.define('person', {
                                        id        : {type : "serial",  size:"8",    mapsTo: "personID", key:true},
					firstName : {type : "text",    size:"255",  mapsTo: "name"},
					lastName  : {type : "text",    size:"255",  mapsTo: "surname"},
					ageYears  : {type : "number",  size:"8",    mapsTo: "age"}
				});

				Pet = db.define('pet', {
                                        id      :  {type : "serial",   size:"8",    mapsTo:"petID", key:true},
					petName :  {type : "text",     size:"255",  mapsTo: "name"}
				});

				Person.hasMany('pets', Pet, {},
                                               { autoFetch:  opts.autoFetchPets,
                                                 mergeTable: 'person_pet',
                                                 mergeId: 'person_id',
                                                 mergeAssocId: 'pet_id'});

				helper.dropSync([ Person, Pet ], function (err) {
					if (err) return done(err);
					//
					// John --+---> Deco
					//        '---> Mutt <----- Jane
					//
					// Justin
					//
					Person.create([{
						firstName    : "John",
						lastName     : "Doe",
						ageYears     : 20,
						pets    : [{
							petName    : "Deco"
						}, {
							petName    : "Mutt"
						}]
					}, {
						firstName  : "Jane",
						lastName   : "Doe",
						ageYears   : 16
					}, {
						firstName : "Justin",
						lastName  : "Dean",
						ageYears  : 18
					}], function (err) {
						Person.find({ firstName: "Jane" }, function (err, people) {
							Pet.find({ petName: "Mutt" }, function (err, pets) {
								people[0].addPets(pets, done);
							});
						});
					});
				});
			};
		};

		describe("getAccessor", function () {
			before(setup());

			it("should not auto-fetch associations", function (done) {
				Person.find({ firstName: "John" }).first(function (err, John) {
					should.equal(err, null);

					John.should.not.have.property("pets");
					return done();
				});
			});

			it("should allow to specify order as string", function (done) {
				Person.find({ firstName: "John" }, function (err, people) {
					should.equal(err, null);

					people[0].getPets("-petName", function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(2);
						pets[0].model().should.equal(Pet);
						pets[0].petName.should.equal("Mutt");
						pets[1].petName.should.equal("Deco");

						return done();
					});
				});
			});

 			it ("should return proper instance model", function(done){
 				Person.find({ firstName: "John" }, function (err, people) {
					people[0].getPets("-petName", function (err, pets) {
						pets[0].model().should.equal(Pet);
						return done();
					});
				});
 			});

			it("should allow to specify order as Array", function (done) {
				Person.find({ firstName: "John" }, function (err, people) {
					should.equal(err, null);

					people[0].getPets([ "petName", "Z" ], function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(2);
						pets[0].petName.should.equal("Mutt");
						pets[1].petName.should.equal("Deco");

						return done();
					});
				});
			});

			it("should allow to specify a limit", function (done) {
				Person.find({ firstName: "John" }).first(function (err, John) {
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
				Person.find({ firstName: "John" }).first(function (err, John) {
					should.equal(err, null);

					John.getPets({ petName: "Mutt" }, function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(1);
						pets[0].petName.should.equal("Mutt");

						return done();
					});
				});
			});

			if (common.protocol() == "mongodb") return;

			it("should return a chain if no callback defined", function (done) {
				Person.find({ firstName: "John" }, function (err, people) {
					should.equal(err, null);

					var chain = people[0].getPets({ firstName: "Mutt" });

					chain.should.be.a("object");
					chain.find.should.be.a("function");
					chain.only.should.be.a("function");
					chain.limit.should.be.a("function");
					chain.order.should.be.a("function");

					return done();
				});
			});

			it("should allow chaining count()", function (done) {
				Person.find({}, function (err, people) {
					should.equal(err, null);

					people[0].getPets().count(function (err, count) {
						should.not.exist(err);

						should.strictEqual(count, 2);

						people[1].getPets().count(function (err, count) {
							should.not.exist(err);

							should.strictEqual(count, 1);

							people[2].getPets().count(function (err, count) {
								should.not.exist(err);

								should.strictEqual(count, 0);

								return done();
							});
						});
					});
				});
			});
		});

		describe("hasAccessor", function () {
			before(setup());

			it("should return true if instance has associated item", function (done) {
				Pet.find({ petName: "Mutt" }, function (err, pets) {
					should.equal(err, null);

					Person.find({ firstName: "Jane" }).first(function (err, Jane) {
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
				Person.find({ firstName: "Jane" }).first(function (err, Jane) {
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
					Person.find({ firstName: "John" }).first(function (err, John) {
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
					Person.find({ firstName: "Jane" }).first(function (err, Jane) {
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
				Pet.find({ petName: "Mutt" }, function (err, pets) {
					Person.find({ firstName: "John" }, function (err, people) {
						should.equal(err, null);

						people[0].removePets(function (err) {
							should.equal(err, null);

							people[0].getPets(function (err, pets) {
								should.equal(err, null);

								should(Array.isArray(pets));
								pets.length.should.equal(1);
								pets[0].petName.should.equal("Deco");

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
				Pet.find({ petName: "Mutt" }, function (err, pets) {
					Person.find({ firstName: "John" }, function (err, people) {
						should.equal(err, null);

						people[0].removePets(pets[0], function (err) {
							should.equal(err, null);

							people[0].getPets(function (err, pets) {
								should.equal(err, null);

								should(Array.isArray(pets));
								pets.length.should.equal(1);
								pets[0].petName.should.equal("Deco");

								return done();
							});
						});
					});
				});
			});

			it("should remove all associations if none passed", function (done) {
				Person.find({ firstName: "John" }).first(function (err, John) {
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

			if (common.protocol() != "mongodb") {
				it("might add duplicates", function (done) {
					Pet.find({ petName: "Mutt" }, function (err, pets) {
						Person.find({ firstName: "Jane" }, function (err, people) {
							should.equal(err, null);

							people[0].addPets(pets[0], function (err) {
								should.equal(err, null);

								people[0].getPets("petName", function (err, pets) {
									should.equal(err, null);

									should(Array.isArray(pets));
									pets.length.should.equal(2);
									pets[0].petName.should.equal("Mutt");
									pets[1].petName.should.equal("Mutt");

									return done();
								});
							});
						});
					});
				});
			}

			it("should keep associations and add new ones", function (done) {
				Pet.find({ petName: "Deco" }).first(function (err, Deco) {
					Person.find({ firstName: "Jane" }).first(function (err, Jane) {
						should.equal(err, null);

						Jane.getPets(function (err, janesPets) {
							should.not.exist(err);

							var petsAtStart = janesPets.length;

							Jane.addPets(Deco, function (err) {
								should.equal(err, null);

								Jane.getPets("petName", function (err, pets) {
									should.equal(err, null);

									should(Array.isArray(pets));
									pets.length.should.equal(petsAtStart + 1);
									pets[0].petName.should.equal("Deco");
									pets[1].petName.should.equal("Mutt");

									return done();
								});
							});
						});
					});
				});
			});

			it("should accept several arguments as associations", function (done) {
				Pet.find(function (err, pets) {
					Person.find({ firstName: "Justin" }).first(function (err, Justin) {
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

			it("should accept array as list of associations", function (done) {
				Pet.create([{ petName: 'Ruff' }, { petName: 'Spotty' }],function (err, pets) {
					Person.find({ firstName: "Justin" }).first(function (err, Justin) {
						should.equal(err, null);

						Justin.getPets(function (err, justinsPets) {
							should.equal(err, null);

							var petCount = justinsPets.length;

							Justin.addPets(pets, function (err) {
								should.equal(err, null);

								Justin.getPets(function (err, justinsPets) {
									should.equal(err, null);

									should(Array.isArray(justinsPets));
									// Mongo doesn't like adding duplicates here, so we add new ones.
									should.equal(justinsPets.length, petCount + 2);

									return done();
								});
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

		describe("setAccessor", function () {
			before(setup());

			it("should accept several arguments as associations", function (done) {
				Pet.find(function (err, pets) {
					Person.find({ firstName: "Justin" }).first(function (err, Justin) {
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
					Person.find({ firstName: "Justin" }).first(function (err, Justin) {
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

			it("should remove all associations if an empty array is passed", function (done) {
				Person.find({ firstName: "Justin" }).first(function (err, Justin) {
					should.equal(err, null);
					Justin.getPets(function (err, pets) {
						should.equal(err, null);
						should.equal(pets.length, 2);

						Justin.setPets([], function (err) {
							should.equal(err, null);

							Justin.getPets(function (err, pets) {
								should.equal(err, null);
								should.equal(pets.length, 0);

								return done();
							});
						});
					});
				});
			});

			it("clears current associations", function (done) {
				Pet.find({ petName: "Deco" }, function (err, pets) {
					var Deco = pets[0];

					Person.find({ firstName: "Jane" }).first(function (err, Jane) {
						should.equal(err, null);

						Jane.getPets(function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(1);
							pets[0].petName.should.equal("Mutt");

							Jane.setPets(Deco, function (err) {
								should.equal(err, null);

								Jane.getPets(function (err, pets) {
									should.equal(err, null);

									should(Array.isArray(pets));
									pets.length.should.equal(1);
									pets[0].petName.should.equal(Deco.petName);

									return done();
								});
							});
						});
					});
				});
			});
		});

		describe("with autoFetch turned on", function () {
			before(setup({
				autoFetchPets : true
			}));

			it("should fetch associations", function (done) {
				Person.find({ firstName: "John" }).first(function (err, John) {
					should.equal(err, null);

					John.should.have.property("pets");
					should(Array.isArray(John.pets));
					John.pets.length.should.equal(2);

					return done();
				});
			});

			it("should save existing", function (done) {
				Person.create({ firstName: 'Bishan' }, function (err) {
					should.not.exist(err);

					Person.one({ firstName: 'Bishan' }, function (err, person) {
						should.not.exist(err);

						person.lastName = 'Dominar';

						person.save(function (err) {
							should.not.exist(err);

							done();
						});
					});
				});
			});

			it("should not auto save associations which were autofetched", function (done) {
				Pet.all(function (err, pets) {
					should.not.exist(err);
					should.equal(pets.length, 2);

					Person.create({ firstName: 'Paul' }, function (err, paul) {
						should.not.exist(err);

						Person.one({ firstName: 'Paul' }, function (err, paul2) {
							should.not.exist(err);
							should.equal(paul2.pets.length, 0);

							paul.setPets(pets, function (err) {
								should.not.exist(err);

								// reload paul to make sure we have 2 pets
								Person.one({ firstName: 'Paul' }, function (err, paul) {
									should.not.exist(err);
									should.equal(paul.pets.length, 2);

									// Saving paul2 should NOT auto save associations and hence delete
									// the associations we just created.
									paul2.save(function (err) {
										should.not.exist(err);

										// let's check paul - pets should still be associated
										Person.one({ firstName: 'Paul' }, function (err, paul) {
											should.not.exist(err);
											should.equal(paul.pets.length, 2);

											done();
										});
									});
								});
							});
						});
					});
				});
			});

			it("should save associations set by the user", function (done) {
				Person.one({ firstName: 'John' }, function (err, john) {
					should.not.exist(err);
					should.equal(john.pets.length, 2);

					john.pets = [];

					john.save(function (err) {
						should.not.exist(err);

						// reload john to make sure pets were deleted
						Person.one({ firstName: 'John' }, function (err, john) {
							should.not.exist(err);
							should.equal(john.pets.length, 0);

							done();
						});
					});
				});
			});

		});
	});
});
