var ORM = require('../../');
var helper = require('../support/spec_helper');
var should = require('should');
var async = require('async');
var common = require('../common');
var _ = require('lodash');

describe("hasOne Async", function () {
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

      person.getPet.should.be.a.Function();
      person.setPet.should.be.a.Function();
      person.removePet.should.be.a.Function();
      person.hasPet.should.be.a.Function();

      pet.getOwners.should.be.a.Function();
      pet.setOwners.should.be.a.Function();
      pet.hasOwners.should.be.a.Function();
  
      person.getPetAsync.should.be.a.Function();
      person.setPetAsync.should.be.a.Function();
      person.removePetAsync.should.be.a.Function();
      person.hasPetAsync.should.be.a.Function();
  
      pet.getOwnersAsync.should.be.a.Function();
      pet.setOwnersAsync.should.be.a.Function();
      pet.hasOwnersAsync.should.be.a.Function();

      return done();
    });

    describe(".getAccessorAsync()", function () {

      it("compare if model updated", function () {
        return Person
          .findAsync({ name: "John Doe" })
          .then(function (John) {
            return [John, Pet.findAsync({ name: "Deco" })];
          })
          .spread(function (John, deco) {
            return [John[0], deco[0], deco[0].hasOwnersAsync()];
          })
          .spread(function (John, deco, has_owner) {
            has_owner.should.equal(false);
            return [deco.setOwnersAsync(John), deco];
          })
          .spread(function (John, deco) {
            return [John, deco.getOwnersAsync()];
          })
          .spread(function (John, JohnCopy) {
            should(Array.isArray(JohnCopy));
            John.should.eql(JohnCopy[0]);
          });
      });
      
    });

    it("should be able to set an array of people as the owner", function () {
      return Person
        .findAsync({ name: ["John Doe", "Jane Doe"] })
        .then(function (owners) {
          return [owners, Pet.findAsync({ name: "Fido" })];
        })
        .spread(function (owners, Fido) {
          return [Fido[0], owners, Fido[0].hasOwnersAsync()];
        })
        .spread(function (Fido, owners, has_owner) {
          has_owner.should.equal(false);
          return [Fido, owners, Fido.setOwnersAsync(owners)];
        })
        .spread(function (Fido, owners) {
          return [owners, Fido.getOwnersAsync()];
        })
        .spread(function (owners, ownersCopy) {
          should(Array.isArray(owners));
          owners.length.should.equal(2);
          // Don't know which order they'll be in.
          var idProp = common.protocol() == 'mongodb' ? '_id' : 'id'

          if (owners[0][idProp] == ownersCopy[0][idProp]) {
            owners[0].should.eql(ownersCopy[0]);
            owners[1].should.eql(ownersCopy[1]);
          } else {
            owners[0].should.eql(ownersCopy[1]);
            owners[1].should.eql(ownersCopy[0]);
          }
        });
    });
  });

  describe("reverse find", function () {
    before(setup());
    it("should be able to find given an association id", function () {
      return Person
        .findAsync({ name: "John Doe" })
        .then(function (John) {
          should.exist(John);
          return [John, Pet.findAsync({ name: "Deco" })];
        })
        .spread(function (John, Deco) {
          should.exist(Deco);
          return [John[0], Deco[0], Deco[0].hasOwnersAsync()];
        })
        .spread(function (John, Deco, has_owner) {
          has_owner.should.equal(false);
          return [John, Deco.setOwnersAsync(John)];
        })
        .spread(function (John) {
          return [John, Person.findAsync({ pet_id: 1 })];
        })
        .spread(function (John, owner) {
          should.exist(owner[0]);
          should.equal(owner[0].name, John.name);
        });
    });
    
    it("should be able to find given an association instance", function () {
      return Person
        .findAsync({ name: "John Doe" })
        .then(function (John) {
          var John = John[0];
          should.exist(John);
          return [John, Pet.findAsync({ name: "Deco" })];
        })
        .spread(function (John, Deco) {
          var Deco = Deco[0];
          should.exist(Deco);
          return [John, Deco, Deco.hasOwnersAsync()];
        })
        .spread(function (John, Deco, has_owner) {
          has_owner.should.equal(false);
          return [John, Deco.setOwnersAsync(John)];
        })
        .spread(function (John, Deco) {
          return [John, Person.findAsync({ pet: Deco, id: John.id })];
        })
        .spread(function(John, owner){
          should.exist(owner[0]);
          should.equal(owner[0].name, John.name);
        });
    });

    it("should be able to find given a number of association instances with a single primary key", function () {
      return Person.findAsync({ name: "John Doe" })
        .then(function (John) {
          should.exist(John);
          return [John, Pet.allAsync()];
        })
        .spread(function (John, pets) {
          should.exist(pets);
          should.equal(pets.length, 2);
          return [John[0], pets, pets[0].hasOwnersAsync()];
        })
        .spread(function (John, pets, has_owner) {
          has_owner.should.equal(false);
          return [John, pets, pets[0].setOwnersAsync(John)];
        })
        .spread(function (John, pets) {
          return [John, Person.findAsync({ pet: pets, id: John.id })];
        })
        .spread(function (John, owners) {
          should.exist(owners[0]);
          owners.length.should.equal(1);
          should.equal(owners[0].name, John.name);
        });
    });
  });
});
