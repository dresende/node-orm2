var ORM    = require('../../');
var helper = require('../support/spec_helper');
var should = require('should');
var async  = require('async');
var _      = require('lodash');

describe("hasOne", function() {
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
				Person.create({
					name : "John Doe"
				}, function () {
					Pet.create({
						name : "Deco"
					}, done);
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
	});
});
