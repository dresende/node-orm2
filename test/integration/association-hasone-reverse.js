var ORM = require('../../');
var helper = require('../support/spec_helper');
var should = require('should');
var async = require('async');
var common = require('../common');
var _ = require('lodash');

describe("hasOne", function () {
	var db = null;
	var Person = null;
	var Pet = null;

	var setup = function () {
		return function (done) {
			Person = db.define('person', {
				name: String
			});
			Pet = db.define('pet', {
				name: String
			});
			Person.hasOne('pet', Pet, {
				reverse: 'owners',
				field: 'pet_id'
			});

			return helper.dropSync([Person, Pet], function () {
				// Running in series because in-memory sqlite encounters problems
				async.series([
					Person.create.bind(Person, { name: "John Doe" }),
					Person.create.bind(Person, { name: "Jane Doe" }),
					Pet.create.bind(Pet, { name: "Deco"  }),
					Pet.create.bind(Pet, { name: "Fido"  })
				], done);
			});
		};
	};

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

	describe("reverse", function () {
		removeHookRun = false;

		before(setup({
			hooks: {
				beforeRemove: function () {
					removeHookRun = true;
				}
			}
		}));

		it("should create methods in both models", function (done) {
			var person = Person(1);
			var pet = Pet(1);

			person.getPet.should.be.a("function");
			person.setPet.should.be.a("function");
			person.removePet.should.be.a("function");
			person.hasPet.should.be.a("function");

			pet.getOwners.should.be.a("function");
			pet.setOwners.should.be.a("function");
			pet.hasOwners.should.be.a("function");

			return done();
		});

		describe(".getAccessor()", function () {
			it("should work", function (done) {
				Person.find({ name: "John Doe" }).first(function (err, John) {
					Pet.find({ name: "Deco" }).first(function (err, Deco) {
						Deco.hasOwners(function (err, has_owner) {
							should.not.exist(err);
							has_owner.should.be.false;

							Deco.setOwners(John, function (err) {
								should.not.exist(err);

								Deco.getOwners(function (err, JohnCopy) {
									should.not.exist(err);
									should(Array.isArray(JohnCopy));
									John.should.eql(JohnCopy[0]);

									return done();
								});
							});
						});
					});
				});
			});

			describe("Chain", function () {
				before(function (done) {
					var petParams = [
						{ name: "Hippo" },
						{ name: "Finch", owners: [{ name: "Harold" }, { name: "Hagar" }] },
						{ name: "Fox",   owners: [{ name: "Nelly"  }, { name: "Narnia" }] }
					];

					Pet.create(petParams, function (err, pets) {
						should.not.exist(err);
						should.equal(pets.length, 3);

						Person.find({ name: ["Harold", "Hagar", "Nelly", "Narnia"] }, function (err, people) {
							should.not.exist(err);
							should.exist(people);
							should.equal(people.length, 4);

							done();
						});
					});
				});

				it("should be returned if no callback is passed", function (done) {
					Pet.one(function (err, pet) {
						should.not.exist(err);
						should.exist(pet);

						var chain = pet.getOwners();

						should.equal(typeof chain,     'object');
						should.equal(typeof chain.run, 'function');

						done()
					});
				});

				it(".remove() should not call hooks", function (done) {
					Pet.one({ name: "Finch" }, function (err, pet) {
						should.not.exist(err);
						should.exist(pet);

						should.equal(removeHookRun, false);
						pet.getOwners().remove(function (err) {
							should.not.exist(err);
							should.equal(removeHookRun, false);

							Person.find({ name: "Harold" }, function (err, items) {
								should.not.exist(err);
								should.equal(items.length, 0);
								done();
							});
						});
					});
				});

			});
		});

		it("should be able to set an array of people as the owner", function (done) {
			Person.find({ name: ["John Doe", "Jane Doe"] }, function (err, owners) {
				Pet.find({ name: "Fido" }).first(function (err, Fido) {
					Fido.hasOwners(function (err, has_owner) {
						should.not.exist(err);
						has_owner.should.be.false;

						Fido.setOwners(owners, function (err) {
							should.not.exist(err);

							Fido.getOwners(function (err, ownersCopy) {
								should.not.exist(err);
								should(Array.isArray(owners));
								owners.length.should.equal(2);

								if (owners[0] == ownersCopy[0]) {
									owners[0].should.eql(ownersCopy[0]);
									owners[1].should.eql(ownersCopy[1]);
								} else {
									owners[0].should.eql(ownersCopy[1]);
									owners[1].should.eql(ownersCopy[0]);
								}

								return done();
							});
						});
					});
				});
			});
		});

		// broken in mongo
		if (common.protocol() != "mongodb") {
			describe("findBy()", function () {
				before(setup());

				before(function (done) {
					Person.one({ name: "Jane Doe" }, function (err, jane) {
						Pet.one({ name: "Deco" }, function (err, deco) {
							deco.setOwners(jane, function (err) {
								should.not.exist(err);
								done();
							});
						});
					});
				});

				it("should throw if no conditions passed", function (done) {
					(function () {
						Pet.findByOwners(function () {});
					}).should.throw();

					return done();
				});

				it("should lookup reverse Model based on associated model properties", function (done) {
					Pet.findByOwners({
						name: "Jane Doe"
					}, function (err, pets) {
						should.not.exist(err);
						should.equal(Array.isArray(pets), true);

						// This often fails for sqlite on travis
						if (common.isTravis() && common.protocol() != 'sqlite') {
							should.equal(pets.length, 1);
							should.equal(pets[0].name, 'Deco');
						}

						return done();
					});
				});

				it("should return a ChainFind if no callback passed", function (done) {
					var ChainFind = Pet.findByOwners({
						name: "John Doe"
					});
					ChainFind.run.should.be.a("function");

					return done();
				});
			});
		}
	});

	describe("reverse find", function () {
		it("should be able to find given an association id", function (done) {
			common.retry(setup(), function (done) {
				Person.find({ name: "John Doe" }).first(function (err, John) {
					should.not.exist(err);
					should.exist(John);
					Pet.find({ name: "Deco" }).first(function (err, Deco) {
						should.not.exist(err);
						should.exist(Deco);
						Deco.hasOwners(function (err, has_owner) {
							should.not.exist(err);
							has_owner.should.be.false;

							Deco.setOwners(John, function (err) {
								should.not.exist(err);

								Person.find({ pet_id: Deco[Pet.id[0]] }).first(function (err, owner) {
									should.not.exist(err);
									should.exist(owner);
									should.equal(owner.name, John.name);
									done();
								});

							});
						});
					});
				});
			}, 3, done);
		});

		it("should be able to find given an association instance", function (done) {
			common.retry(setup(), function (done) {
				Person.find({ name: "John Doe" }).first(function (err, John) {
					should.not.exist(err);
					should.exist(John);
					Pet.find({ name: "Deco" }).first(function (err, Deco) {
						should.not.exist(err);
						should.exist(Deco);
						Deco.hasOwners(function (err, has_owner) {
							should.not.exist(err);
							has_owner.should.be.false;

							Deco.setOwners(John, function (err) {
								should.not.exist(err);

								Person.find({ pet: Deco }).first(function (err, owner) {
									should.not.exist(err);
									should.exist(owner);
									should.equal(owner.name, John.name);
									done();
								});

							});
						});
					});
				});
			}, 3, done);
		});

		it("should be able to find given a number of association instances with a single primary key", function (done) {
			common.retry(setup(), function (done) {
				Person.find({ name: "John Doe" }).first(function (err, John) {
					should.not.exist(err);
					should.exist(John);
					Pet.all(function (err, pets) {
						should.not.exist(err);
						should.exist(pets);
						should.equal(pets.length, 2);

						pets[0].hasOwners(function (err, has_owner) {
							should.not.exist(err);
							has_owner.should.be.false;

							pets[0].setOwners(John, function (err) {
								should.not.exist(err);

								Person.find({ pet: pets }, function (err, owners) {
									should.not.exist(err);
									should.exist(owners);
									owners.length.should.equal(1);

									should.equal(owners[0].name, John.name);
									done();
								});
							});
						});
					});
				});
			}, 3, done);
		});
	});
});
