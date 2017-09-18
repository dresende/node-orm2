var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var protocol = common.protocol();

describe("hasMany", function () {
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
          name    : String,
          surname : String,
          age     : Number
        });
        Pet = db.define('pet', {
          name    : String
        });
        Person.hasMany('pets', Pet, {}, { autoFetch: opts.autoFetchPets });

        helper.dropSync([ Person, Pet], function (err) {
          should.not.exist(err);

          Pet.create([{ name: "Cat" }, { name: "Dog" }], function (err) {
            should.not.exist(err);

            /**
             * John --+---> Deco
             *        '---> Mutt <----- Jane
             *
             * Justin
             */
            Person.create([
              {
                name    : "Bob",
                surname : "Smith",
                age     : 30
              },
              {
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
              }
            ], function (err) {
              should.not.exist(err);

              Person.find({ name: "Jane" }, function (err, people) {
                should.not.exist(err);

                Pet.find({ name: "Mutt" }, function (err, pets) {
                  should.not.exist(err);

                  people[0].addPets(pets, done);
                });
              });
            });
          });
        });
      };
    };

    describe("getAccessorAsync", function () {
      before(setup());

      it("should allow to specify order as string", function () {
        return Person.findAsync({ name: "John" })
          .then(function (people) {
            return people[0].getPetsAsync("-name");
          })
          .then(function (pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(2);
            pets[0].model().should.equal(Pet);
            pets[0].name.should.equal("Mutt");
            pets[1].name.should.equal("Deco");
          });
      });

      it("should return proper instance model", function(){
        return Person.findAsync({ name: "John" })
          .then(function (people) {
            return people[0].getPetsAsync("-name");
          })
          .then(function (pets) {
            pets[0].model().should.equal(Pet);
          });
      });

      it("should allow to specify order as Array", function () {
        return Person.findAsync({ name: "John" })
          .then(function (people) {
            return people[0].getPetsAsync([ "name", "Z" ]);
          })
          .then(function (pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(2);
            pets[0].name.should.equal("Mutt");
            pets[1].name.should.equal("Deco");
          });
      });

      it("should allow to specify a limit", function () {
        return Person.find({ name: "John" })
          .firstAsync()
          .then(function (John) {
            return John.getPetsAsync(1)
            })
          .then(function (pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(1);
          });
      });

      it("should allow to specify conditions", function () {
        return Person.find({ name: "John" }).firstAsync()
          .then(function (John) {
            return John.getPetsAsync({ name: "Mutt" });
          })
          .then(function (pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(1);
            pets[0].name.should.equal("Mutt");
          });
      });

      if (common.protocol() == "mongodb") return;

      it("should allow chaining count()", function () {
        return Person.findAsync({})
          .then(function (people) {
            return [people[1].getPetsAsync(), people[2].getPetsAsync(), people[3].getPetsAsync()];
          })
          .spread(function (count1, count2, count3) {
            should.strictEqual(count1.length, 2);
            should.strictEqual(count2.length, 1);
            should.strictEqual(count3.length, 0);
          });
      });
    });

    describe("hasAccessorAsync", function () {
      before(setup());

      it("should return true if instance has associated item", function () {
        return Pet.findAsync({ name: "Mutt" })
          .then(function (pets) {
            return [pets, Person.find({ name: "Jane" }).firstAsync()];
          })
          .spread(function (pets, Jane) {
            return Jane.hasPetsAsync(pets[0]);
          })
          .then(function (has_pets) {
            has_pets.should.be.true();
          });
      });

      it("should return false if any passed instances are not associated", function () {
        return Pet.findAsync()
          .then(function (pets) {
            return [pets, Person.find({ name: "Jane" }).firstAsync()];
          })
          .spread(function (pets, Jane) {
            return Jane.hasPetsAsync(pets);
          })
          .then(function (has_pets) {
            has_pets.should.be.false();
          });
      });

      if (common.protocol() != "mongodb") {
        it("should return true if join table has duplicate entries", function () {
          return Pet.findAsync({ name: ["Mutt", "Deco"] })
            .then(function (pets) {
              should.equal(pets.length, 2);

              return [pets, Person.find({ name: "John" }).firstAsync()];
            })
            .spread(function (pets, John) {
              return [John, pets, John.hasPetsAsync(pets)];
            })
            .spread(function (John, pets, hasPets) {
              should.equal(hasPets, true);

              return [
                John,
                pets,
                db.driver.execQueryAsync(
                  "INSERT INTO person_pets (person_id, pets_id) VALUES (?,?), (?,?)",
                  [John.id, pets[0].id, John.id, pets[1].id]
                )
              ];
            })
            .spread(function (John, pets) {
              return John.hasPetsAsync(pets);
            })
            .then(function (hasPets) {
              should.equal(hasPets, true);
            });
        });

        it("should return true if join table has duplicate entries (promise-based)", function () {
          return Pet.findAsync({ name: ["Mutt", "Deco"] })
            .then(function (pets) {
              should.equal(pets.length, 2);

              return [pets, Person.find({ name: "John" }).firstAsync()];
            })
            .spread(function (pets, John) {
              return [ John, pets, John.hasPetsAsync(pets)];
            })
            .spread(function (John, pets, hasPets) {
              should.equal(hasPets, true);

              return [
                John,
                pets,
                db.driver.execQueryAsync(
                  "INSERT INTO person_pets (person_id, pets_id) VALUES (?,?), (?,?)",
                  [John.id, pets[0].id, John.id, pets[1].id]
                )
              ];
            })
            .spread(function (John, pets) {
              return John.hasPetsAsync(pets);
            })
            .then(function (hasPets) {
              should.equal(hasPets, true);
            });
        });
      }
    });

    describe("delAccessorAsync", function () {
      before(setup());

      it("should accept arguments in different orders", function () {
        return Pet.findAsync({ name: "Mutt" })
          .then(function (pets) {
            return [pets, Person.findAsync({ name: "John" })];
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
            pets[0].name.should.equal("Deco");
          });
      });

      it("should remove specific associations if passed", function () {
        return Pet.findAsync({ name: "Mutt" })
          .then(function (pets) {
            return [pets, Person.findAsync({ name: "John" })];
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
            pets[0].name.should.equal("Deco");
          });
      });

      it("should remove all associations if none passed", function () {
        return Person.find({ name: "John" }).firstAsync()
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

        it("might add duplicates (promise-based)", function () {
          return Pet.findAsync({ name: "Mutt" })
            .then(function (pets) {
              return [pets, Person.findAsync({ name: "Jane" })];
            })
            .spread(function (pets, people) {
              return [people, people[0].addPetsAsync(pets[0])];
            })
            .spread(function (people) {
              return people[0].getPetsAsync("name");
            })
            .then(function (pets) {
              should(Array.isArray(pets));
              pets.length.should.equal(2);
              pets[0].name.should.equal("Mutt");
              pets[1].name.should.equal("Mutt");
            });
        });
      }

      it("should keep associations and add new ones", function () {
        return Pet.find({ name: "Deco" }).firstAsync()
          .then(function (Deco) {
            return [Deco, Person.find({ name: "Jane" }).firstAsync()];
          })
          .spread(function (Deco, Jane) {
            return [Jane, Deco, Jane.getPetsAsync()]
          })
          .spread(function (Jane, Deco, janesPets) {
            var petsAtStart = janesPets.length;

            return [petsAtStart, Jane, Jane.addPetsAsync(Deco)];
          })
          .spread(function (petsAtStart, Jane) {
            return [petsAtStart, Jane.getPetsAsync("name")];
          })
          .spread(function (petsAtStart, pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(petsAtStart + 1);
            pets[0].name.should.equal("Deco");
            pets[1].name.should.equal("Mutt");
          });
      });

      it("should accept several arguments as associations (promise-based)", function () {
        return Pet.findAsync()
          .then(function (pets) {
            return [pets, Person.find({ name: "Justin" }).firstAsync()];
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

      it("should accept array as list of associations (promise-based)", function () {
        return Pet.createAsync([{ name: 'Ruff' }, { name: 'Spotty' }])
          .then(function (pets) {
            return [pets, Person.find({ name: "Justin" }).firstAsync()];
          })
          .spread(function (pets, Justin) {
            return [pets, Justin, Justin.getPetsAsync()];
          })
          .spread(function (pets, Justin, justinsPets) {
            var petCount = justinsPets.length;

            return [Justin, petCount, Justin.addPetsAsync(pets)];
          })
          .spread(function (Justin, petCount) {
            return [petCount, Justin.getPetsAsync()];
          })
          .spread(function (petCount, justinsPets) {
            should(Array.isArray(justinsPets));
            // Mongo doesn't like adding duplicates here, so we add new ones.
            should.equal(justinsPets.length, petCount + 2);
          });
      });
    });

    describe("setAccessorAsync", function () {
      before(setup());

      it("should accept several arguments as associations", function () {
        return Pet.findAsync()
          .then(function (pets) {
            return [pets, Person.find({ name: "Justin" }).firstAsync()];
          })
          .spread(function (pets, Justin) {
            return [Justin, Justin.setPetsAsync(pets[0], pets[1])]
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
            return [pets, Person.find({ name: "Justin" }).firstAsync()];
          })
          .spread(function (pets, Justin) {
            return [pets, Justin, Justin.setPetsAsync(pets)];
          })
          .spread(function (pets, Justin) {
            return [pets, Justin.getPetsAsync()];
          })
          .spread(function (pets, all_pets) {
            should(Array.isArray(all_pets));
            all_pets.length.should.equal(pets.length);
          });
      });

      it("should remove all associations if an empty array is passed", function () {
        return Person.find({ name: "Justin" }).firstAsync()
          .then(function (Justin) {
            return [Justin, Justin.getPetsAsync()];
          })
          .spread(function (Justin, pets) {
            should.equal(pets.length, 4);

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
        return Pet.findAsync({ name: "Deco" })
          .then(function (pets) {
            var Deco = pets[0];

            return [Deco, Person.find({ name: "Jane" }).firstAsync()];
          })
          .spread(function (Deco, Jane) {
            return [Jane, Deco, Jane.getPetsAsync()];
          })
          .spread(function (Jane, Deco, pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(1);
            pets[0].name.should.equal("Mutt");

            return [Jane, Deco, Jane.setPetsAsync(Deco)];
          })
          .spread(function (Jane, Deco) {
            return [Deco, Jane.getPetsAsync()];
          })
          .spread(function (Deco, pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(1);
            pets[0].name.should.equal(Deco.name);
          });
      });
    });

    describe("with autoFetch turned on", function () {
      before(setup({
        autoFetchPets : true
      }));

      it("should fetch associations", function () {
        return Person.find({ name: "John" }).firstAsync()
          .then(function (John) {
            John.should.have.property("pets");
            should(Array.isArray(John.pets));
            John.pets.length.should.equal(2);
          });
      });

      it("should save existing", function () {
        return Person.createAsync({ name: 'Bishan' })
          .then(function () {
            return Person.oneAsync({ name: 'Bishan' });
          })
          .then(function (person) {
            person.surname = 'Dominar';

            return person.saveAsync();
          })
          .then(function (person) {
            should.equal(person.surname, 'Dominar');
          });
      });

      it("should not auto save associations which were autofetched", function () {
        return Pet.allAsync()
          .then(function (pets) {
            should.equal(pets.length, 4);

            return [pets, Person.createAsync({ name: 'Paul' })];
          })
          .spread(function (pets) {
            return [pets, Person.oneAsync({ name: 'Paul' })];
          })
          .spread(function (pets, paul) {
            should.equal(paul.pets.length, 0);

            return paul.setPetsAsync(pets);
          })
          .then(function () {
            // reload paul to make sure we have 2 pets
            return Person.oneAsync({ name: 'Paul' });
          })
          .then(function (paul) {
            should.equal(paul.pets.length, 4);

            // Saving paul2 should NOT auto save associations and hence delete
            // the associations we just created.
            return paul.saveAsync();
          })
          .then(function () {
            // let's check paul - pets should still be associated
            return Person.oneAsync({ name: 'Paul' });
          })
          .then(function (paul) {
            should.equal(paul.pets.length, 4);
          });
      });

      it("should save associations set by the user", function () {
        return Person.oneAsync({ name: 'John' })
          .then(function (john) {
            should.equal(john.pets.length, 2);

            john.pets = [];

            return john.saveAsync();
          })
          .then(function () {
            // reload john to make sure pets were deleted
            return Person.oneAsync({ name: 'John' });
          })
          .then(function (john) {
            should.equal(john.pets.length, 0);
          });
      });

    });
  });

  if (protocol == "mongodb") return;

});
