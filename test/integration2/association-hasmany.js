var should = require('should');
var helper = require('../support/spec_helper');
var ORM    = require('../../');

describe("hasMany", function() {
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
			});
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

	describe("hasAccessor", function () {
		before(setup());

		it("should return true if instance has associated item", function (done) {
			Pet.find({ name: "Mutt" }, function (err, pets) {
				should.equal(err, null);

				Person.find({ name: "Jane" }, function (err, people) {
					should.equal(err, null);

					people[0].hasPets(pets[0], function (err, has_pets) {
						should.equal(err, null);
						has_pets.should.be.true;

						return done();
					});
				});
			});
		});

		it("should return true if not passing any instance and has associated items", function (done) {
			Person.find({ name: "Jane" }, function (err, people) {
				should.equal(err, null);

				people[0].hasPets(function (err, has_pets) {
					should.equal(err, null);
					has_pets.should.be.true;

					return done();
				});
			});
		});

		it("should return true if all passed instances are associated", function (done) {
			Pet.find(function (err, pets) {
				Person.find({ name: "John" }, function (err, people) {
					should.equal(err, null);

					people[0].hasPets(pets, function (err, has_pets) {
						should.equal(err, null);
						has_pets.should.be.true;

						return done();
					});
				});
			});
		});

		it("should return false if any passed instances are not associated", function (done) {
			Pet.find(function (err, pets) {
				Person.find({ name: "Jane" }, function (err, people) {
					should.equal(err, null);

					people[0].hasPets(pets, function (err, has_pets) {
						should.equal(err, null);
						has_pets.should.be.false;

						return done();
					});
				});
			});
		});
	});
});
