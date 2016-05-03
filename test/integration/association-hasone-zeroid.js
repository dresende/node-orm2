var _      = require('lodash');
var should = require('should');
var async  = require('async');
var helper = require('../support/spec_helper');
var ORM    = require('../../');

describe("hasOne", function() {
	var db     = null;
	var Person = null;
	var Pet    = null;

	var setup = function (autoFetch) {
		return function (done) {
			db.settings.set('instance.identityCache', false);
			db.settings.set('instance.returnAllErrors', true);

			Person = db.define('person', {
				id        : { type : "integer",  mapsTo: "personID", key: true },
				firstName : { type : "text",     size:   "255" },
				lastName  : { type : "text",     size:   "255" }
			});

			Pet = db.define('pet', {
				id      : { type : "integer",  mapsTo: "petID", key: true },
				petName : { type : "text",     size:   "255" },
				ownerID : { type : "integer",  size:   "4" }
			});

			Pet.hasOne('owner', Person, { field: 'ownerID', autoFetch: autoFetch });

			helper.dropSync([Person, Pet], function(err) {
				if (err) return done(err);

				Pet.create([
					{
						id: 10,
						petName: 'Muttley',
						owner: {
							id: 12,
							firstName: 'Stuey',
							lastName: 'McG'
						}
					},
					{
						id: 11,
						petName: 'Snagglepuss',
						owner: {
							id: 0,
							firstName: 'John',
							lastName: 'Doe'
						}
					}
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

	describe("auto fetch", function () {
		before(setup(true));

		it("should work for non-zero ownerID ", function (done) {
			Pet.find({petName: "Muttley"}, function(err, pets) {
				should.not.exist(err);

				pets[0].petName.should.equal("Muttley");
				pets[0].should.have.property("id");
				pets[0].id.should.equal(10);
				pets[0].ownerID.should.equal(12);

				pets[0].should.have.property("owner");
				pets[0].owner.firstName.should.equal("Stuey");

				return done();
			});
		});

		it("should work for zero ownerID ", function (done) {
			Pet.find({petName: "Snagglepuss"}, function(err, pets) {
				should.not.exist(err);

				pets[0].petName.should.equal("Snagglepuss");
				pets[0].should.have.property("id");
				pets[0].id.should.equal(11);

				db.models.person.all(function (err, people) {
					return done();
				});
			});
		});
	});

	describe("no auto fetch", function () {
		before(setup(false));

		it("should work for non-zero ownerID ", function (done) {
			Pet.find({petName: "Muttley"}, function(err, pets) {
				should.not.exist(err);

				pets[0].petName.should.equal("Muttley");
				pets[0].should.have.property("id");
				pets[0].id.should.equal(10);
				pets[0].ownerID.should.equal(12);

				pets[0].should.not.have.property("owner");

				// But we should be able to see if its there
				pets[0].hasOwner(function(err, result) {
					should.not.exist(err);
					should.equal(result, true);

					// ...and then get it
					pets[0].getOwner(function(err, result) {
						should.not.exist(err);
						result.firstName.should.equal("Stuey");

						return done()
					});
				});
			});
		});

		it("should work for zero ownerID ", function (done) {
			Pet.find({petName: "Snagglepuss"}, function(err, pets) {
				should.not.exist(err);

				pets[0].petName.should.equal("Snagglepuss");
				pets[0].should.have.property("id");
				pets[0].id.should.equal(11);
				pets[0].ownerID.should.equal(0);

				pets[0].should.not.have.property("owner");

				// But we should be able to see if its there
				pets[0].hasOwner(function(err, result) {
					should.not.exist(err);
					should.equal(result, true);

					// ...and then get it
					pets[0].getOwner(function(err, result) {
						should.not.exist(err);
						result.firstName.should.equal("John");

						return done()
					});
				});
			});
		});
	});
});
