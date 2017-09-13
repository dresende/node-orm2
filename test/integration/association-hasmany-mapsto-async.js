var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');

if (common.protocol() == "mongodb") return;   // Can't do mapsTo testing on mongoDB ()

describe("hasMany with MapsTo Async", function () {
  var db     = null;
  var Person = null;
  var Pet    = null;

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

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
        }], function () {
          Person.find({ firstName: "Jane" }, function (err, people) {
            Pet.find({ petName: "Mutt" }, function (err, pets) {
              people[0].addPets(pets, done);
            });
          });
        });
      });
    };
  };

  describe("getAccessorAsync", function () {
    before(setup());

    it("should allow to specify order as string", function () {
      return Person.findAsync({ firstName: "John" })
        .then(function (people) {
          return people[0].getPetsAsync("-petName");
        })
        .then(function (pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(2);
          pets[0].model().should.equal(Pet);
          pets[0].petName.should.equal("Mutt");
          pets[1].petName.should.equal("Deco");
        });
    });

    it("should return proper instance model", function(){
      return Person.findAsync({ firstName: "John" })
        .then(function (people) {
          return people[0].getPetsAsync("-petName");
        })
        .then(function (pets) {
          pets[0].model().should.equal(Pet);
        });
    });

    it("should allow to specify order as Array", function () {
      return Person.findAsync({ firstName: "John" })
        .then(function (people) {
          return people[0].getPetsAsync([ "petName", "Z" ]);
        })
        .then(function (pets) {

          should(Array.isArray(pets));
          pets.length.should.equal(2);
          pets[0].petName.should.equal("Mutt");
          pets[1].petName.should.equal("Deco");
        });
    });

    it("should allow to specify a limit", function () {
      return Person.find({ firstName: "John" }).firstAsync()
        .then(function (John) {
          return John.getPetsAsync(1);
        })
        .then(function (pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(1);
        });
    });

    it("should allow to specify conditions", function () {
      return Person.find({ firstName: "John" }).firstAsync()
        .then(function (John) {
          return John.getPetsAsync({ petName: "Mutt" });
        })
        .then(function (pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(1);
          pets[0].petName.should.equal("Mutt");
        });
    });

    if (common.protocol() == "mongodb") return;

    it("should allow chaining count()", function () {
      return Person.findAsync({})
        .then(function (people) {
          return [people, people[0].getPetsAsync()];
        })
        .spread(function (people, count) {
          should.strictEqual(count.length, 2);
          return [people, people[1].getPetsAsync()];
        })
        .spread(function (people, count) {
          should.strictEqual(count.length, 1);
          return people[2].getPetsAsync();
        })
        .then(function (count) {
          should.strictEqual(count.length, 0);
        });
    });
  });

  describe("hasAccessorAsync", function () {
    before(setup());

    it("should return true if instance has associated item", function () {
      Pet.findAsync({ petName: "Mutt" })
        .then(function (pets) {
          return [pets, Person.find({ firstName: "Jane" }).firstAsync()];
        })
        .spread(function (pets, Jane) {
          return Jane.hasPetsAsync(pets[0]);
        })
        .then(function (has_pets) {
          has_pets.should.equal(true);
        });
    });

    it("should return false if any passed instances are not associated", function () {
      Pet.findAsync()
        .then(function (pets) {
          return [pets, Person.find({ firstName: "Jane" }).firstAsync()];
        })
        .spread(function (pets, Jane) {
          return Jane.hasPetsAsync(pets);
        })
        .then(function (has_pets) {
          has_pets.should.be.false();
        });
    });
  });

  describe("delAccessorAsync", function () {
    before(setup());

    it("should accept arguments in different orders", function () {
      return Pet.findAsync({ petName: "Mutt" })
        .then(function (pets) {
          return [pets, Person.findAsync({ firstName: "John" })];
        })
        .spread(function (pets, people) {
          return [people, people[0].removePetsAsync(pets[0])];
        })
        .spread(function (people) {
          return people[0].getPetsAsync();
        })
        .then(function (pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(1);
          pets[0].petName.should.equal("Deco");

        });
    });
  });

  describe("delAccessorAsync", function () {
    before(setup());

    it("should remove specific associations if passed", function () {
      return Pet.findAsync({ petName: "Mutt" })
        .then(function (pets) {
          return [pets, Person.findAsync({ firstName: "John" })];
        })
        .spread(function (pets, people) {
          return [people, people[0].removePetsAsync(pets[0])];
        })
        .spread(function (people) {
          return people[0].getPetsAsync();
        })
        .then(function (pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(1);
          pets[0].petName.should.equal("Deco");
        });
    });

    it("should remove all associations if none passed", function () {
      return Person.find({ firstName: "John" }).firstAsync()
        .then(function (John) {
          return [John, John.removePetsAsync()];
        })
        .spread(function (John) {
          return John.getPetsAsync();
        })
        .then(function (pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(0);
        });
    });
  });

  describe("addAccessorAsync", function () {
    before(setup());

    if (common.protocol() != "mongodb") {
      it("might add duplicates", function () {
        return Pet.findAsync({ petName: "Mutt" })
          .then(function (pets) {
            return [pets, Person.findAsync({ firstName: "Jane" })];
          })
          .spread(function (pets, people) {
            return [people, people[0].addPetsAsync(pets[0])];
          })
          .spread(function (people) {
            return people[0].getPetsAsync("petName");
          })
          .then(function (pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(2);
            pets[0].petName.should.equal("Mutt");
            pets[1].petName.should.equal("Mutt");
          });
      });
    }

    it("should keep associations and add new ones", function () {
      return Pet.find({ petName: "Deco" }).firstAsync()
        .then(function (Deco) {
          return [Deco, Person.find({ firstName: "Jane" }).firstAsync()];
        })
        .spread(function (Deco, Jane) {
          return [Deco, Jane, Jane.getPetsAsync()];
        })
        .spread(function (Deco, Jane, janesPets) {
          var petsAtStart = janesPets.length;
          return [petsAtStart, Jane, Jane.addPetsAsync(Deco)];
        })
        .spread(function (petsAtStart, Jane) {
          return [petsAtStart, Jane.getPetsAsync("petName")];
        })
        .spread(function (petsAtStart, pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(petsAtStart + 1);
          pets[0].petName.should.equal("Deco");
          pets[1].petName.should.equal("Mutt");
        });
    });

    it("should accept several arguments as associations", function () {
      return Pet.findAsync()
        .then(function (pets) {
          return [pets, Person.find({ firstName: "Justin" }).firstAsync()];
        })
        .spread(function (pets, Justin) {
          return [Justin, Justin.addPetsAsync(pets[0], pets[1])];
        })
        .spread(function (Justin) {
          return Justin.getPetsAsync();
        })
        .then(function (pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(2);
        });
    });

    it("should accept array as list of associations", function () {
      return Pet.createAsync([{ petName: 'Ruff' }, { petName: 'Spotty' }])
        .then(function (pets) {
          return [pets, Person.find({ firstName: "Justin" }).firstAsync()];
        })
        .spread(function (pets, Justin) {
          return [Justin, pets, Justin.getPetsAsync()];
        })
        .spread(function (Justin, pets, justinsPets) {
          var petCount = justinsPets.length;
          return [petCount, Justin, Justin.addPetsAsync(pets)];
        })
        .spread(function (petCount, Justin) {
          return [petCount, Justin.getPetsAsync()];
        })
        .spread(function (petCount, justinsPets) {
          should(Array.isArray(justinsPets));
          // Mongo doesn't like adding duplicates here, so we add new ones.
          should.equal(justinsPets.length, petCount + 2);
        });
    });

    it("should throw if no items passed", function () {
      return Person.oneAsync()
        .then(function (person) {
          return person.addPetsAsync()
        })
        .catch(function(err) {
          should.exists(err);
        });
    });
  });

  describe("setAccessorAsync", function () {
    before(setup());

    it("should accept several arguments as associations", function () {
      return Pet.findAsync()
        .then(function (pets) {
          return [pets, Person.find({ firstName: "Justin" }).firstAsync()];
        })
        .spread(function (pets, Justin) {
          return [Justin, Justin.setPetsAsync(pets[0], pets[1])];
        })
        .spread(function (Justin) {
          return Justin.getPetsAsync();
        })
        .then(function (pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(2);
        });
    });

    it("should accept an array of associations", function () {
      return Pet.findAsync()
        .then(function (pets) {
          return [pets, Person.find({ firstName: "Justin" }).firstAsync()];
        })
        .spread(function (pets, Justin) {
          return [Justin, pets, Justin.setPetsAsync(pets)];
        })
        .spread(function (Justin, pets) {
          return [Justin.getPetsAsync(), pets];
        })
        .spread(function (all_pets, pets) {
          should(Array.isArray(all_pets));
          all_pets.length.should.equal(pets.length);
        });
    });

    it("should remove all associations if an empty array is passed", function () {
      return Person.find({ firstName: "Justin" }).firstAsync()
        .then(function (Justin) {
          return [Justin, Justin.getPetsAsync()];
        })
        .spread(function (Justin, pets) {
          should.equal(pets.length, 2);

          return [Justin, Justin.setPetsAsync([])];
        })
        .spread(function (Justin) {
          return Justin.getPetsAsync();
        })
        .then(function (pets) {
          should.equal(pets.length, 0);
        });
    });

    it("clears current associations", function () {
      return Pet.findAsync({ petName: "Deco" })
        .then(function (pets) {
          var Deco = pets[0];

          return [Deco, Person.find({ firstName: "Jane" }).firstAsync()];
        })
        .spread(function (Deco, Jane) {
          return [Deco, Jane, Jane.getPetsAsync()];
        })
        .spread(function (Deco, Jane, pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(1);
          pets[0].petName.should.equal("Mutt");

          return [pets, Jane, Deco, Jane.setPetsAsync(Deco)]
        })
        .spread(function (pets, Jane, Deco) {
          return [Deco, Jane.getPetsAsync()];
        })
        .spread(function (Deco, pets) {
          should(Array.isArray(pets));
          pets.length.should.equal(1);
          pets[0].petName.should.equal(Deco.petName);
        });
    });
  });

  describe("with autoFetch turned on (promised-based test)", function () {
    before(setup({
      autoFetchPets : true
    }));

    it("should not auto save associations which were autofetched", function () {
      return Pet.allAsync()
        .then(function (pets) {
          should.equal(pets.length, 2);

          return [pets, Person.createAsync({ firstName: 'Paul' })];
        })
        .spread(function (pets, paul) {
          return [pets, paul, Person.oneAsync({ firstName: 'Paul' })];
        })
        .spread(function (pets, paul, paul2) {
          should.equal(paul2.pets.length, 0);

          return [pets, paul, paul2, paul.setPetsAsync(pets)];
        })
        .spread(function (pets, paul2) {

          // reload paul to make sure we have 2 pets
          return [pets, Person.oneAsync({ firstName: 'Paul' }), paul2];
        })
        .spread(function (pets, paul, paul2) {
          should.equal(paul.pets.length, 2);

          // Saving paul2 should NOT auto save associations and hence delete
          // the associations we just created.
          return paul2.saveAsync();
        })
        .then(function () {
          // let's check paul - pets should still be associated
          return Person.oneAsync({ firstName: 'Paul' });
        })
        .then(function (paul) {
          should.equal(paul.pets.length, 2);
        });
    });
  });
});
