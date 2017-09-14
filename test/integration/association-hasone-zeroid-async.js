var _      = require('lodash');
var should = require('should');
var async  = require('async');
var helper = require('../support/spec_helper');
var ORM    = require('../../');

describe("hasOne promise-based methods", function() {
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

    it("should work for non-zero ownerID ", function () {
      return Pet
        .findAsync({petName: "Muttley"})
        .then(function(pets) {
          pets[0].petName.should.equal("Muttley");
          pets[0].should.have.property("id");
          pets[0].id.should.equal(10);
          pets[0].ownerID.should.equal(12);
          pets[0].should.have.property("owner");
          pets[0].owner.firstName.should.equal("Stuey");
        });
    });

    it("should work for zero ownerID ", function () {
      return Pet
        .findAsync({petName: "Snagglepuss"})
        .then(function(pets) {
          pets[0].petName.should.equal("Snagglepuss");
          pets[0].should.have.property("id");
          pets[0].id.should.equal(11);
  
          return Person.allAsync();
        })
        .then(function (people) {
          should.equal(typeof people[0], 'object');
          should.equal(Array.isArray(people), true);
          people[0].should.have.property("firstName", "Stuey");
        });
    });
  });

  describe("no auto fetch", function () {
    before(setup(false));
    
    it("should work for non-zero ownerID (promise-based)", function () {
      return Pet
        .findAsync({petName: "Muttley"})
        .then(function(pets) {
          var pets = pets[0];
          
          pets.petName.should.equal("Muttley");
          pets.should.have.property("id");
          pets.id.should.equal(10);
          pets.ownerID.should.equal(12);

          pets.should.not.have.property("owner");

          // But we should be able to see if its there
          return [pets, pets.hasOwnerAsync()];
        })
        .spread(function(pets, hasOwner) {
          should.equal(hasOwner, true);
          // ...and then get it
          return pets.getOwnerAsync();
        })
        .then(function(petOwner) {
          petOwner.firstName.should.equal("Stuey");
        });
    });

    it("should work for zero ownerID", function () {
      return Pet
        .findAsync({petName: "Snagglepuss"})
        .then(function(pets) {
          var pets = pets[0];
          
          pets.petName.should.equal("Snagglepuss");
          pets.should.have.property("id");
          pets.id.should.equal(11);
          pets.ownerID.should.equal(0);

          pets.should.not.have.property("owner");

          // But we should be able to see if its there
          return [pets, pets.hasOwnerAsync()];
        })
        .spread(function(pets, hasOwner) {
          should.equal(hasOwner, true);
          
          // ...and then get it
          return pets.getOwnerAsync();
        })
        .then(function(petOwner) {
          petOwner.firstName.should.equal("John");
        });
    });
  });
});
