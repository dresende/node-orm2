var ORM    = require('../../');
var helper = require('../support/spec_helper');
var should = require('should');
var async  = require('async');
var _      = require('lodash');

describe("hasOne", function () {
	var db     = null;
	var Person = null;

	var setup = function () {
		return function (done) {
			Person = db.define('person', {
				name     : String
			});
			Pet = db.define('pet', {
				name     : String
			});
			Person.hasOne('pet', Pet, {
				reverse : 'owner'
			});

			return helper.dropSync([ Person, Pet ], function () {
				async.parallel([
					Person.create.bind(Person, { name: "John Doe" }),
					Person.create.bind(Person, { name: "Jane Doe" }),
					Pet.create.bind(Pet, { name: "Deco" }),
					Pet.create.bind(Pet, { name: "Fido" }),
				], done);
			});
		};
	};

	before(function(done) {
		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

	describe("reverse", function () {
		before(setup());

		it("should create methods in both models", function (done) {
			var person = Person(1);
			var pet    = Pet(1);

			person.getPet.should.be.a("function");
			person.setPet.should.be.a("function");
			person.removePet.should.be.a("function");
			person.hasPet.should.be.a("function");

			pet.getOwner.should.be.a("function");
			pet.setOwner.should.be.a("function");
			pet.hasOwner.should.be.a("function");

			return done();
		});

		it("should be able to fetch model from reverse model", function (done) {
			Person.find({ name: "John Doe" }).first(function (err, John) {
				Pet.find({ name: "Deco" }).first(function (err, Deco) {
					Deco.hasOwner(function (err, has_owner) {
						should.not.exist(err);
						has_owner.should.be.false;

						Deco.setOwner(John, function (err) {
							should.not.exist(err);

							Deco.getOwner(function (err, JohnCopy) {
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

		it("should be able to set an array of people as the owner", function (done) {
			Person.find({ name: ["John Doe", "Jane Doe"] }, function (err, owners) {
				Pet.find({ name: "Fido" }).first(function (err, Fido) {
					Fido.hasOwner(function (err, has_owner) {
						should.not.exist(err);
						has_owner.should.be.false;

						Fido.setOwner(owners, function (err) {
							should.not.exist(err);

							Fido.getOwner(function (err, ownersCopy) {
								should.not.exist(err);
								should(Array.isArray(owners));
								owners.length.should.equal(2);

								owners[0].should.eql(ownersCopy[0]);
								owners[1].should.eql(ownersCopy[1]);

								return done();
							});
						});
					});
				});
			});
		});
	});
});
