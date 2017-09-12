var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
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

      it("should allow to specify order as string", function (done) {
        Person.find({ name: "John" }, function (err, people) {
          should.equal(err, null);

          people[0].getPetsAsync("-name").then(function (pets) {

            should(Array.isArray(pets));
            pets.length.should.equal(2);
            pets[0].model().should.equal(Pet);
            pets[0].name.should.equal("Mutt");
            pets[1].name.should.equal("Deco");

            done();
          }).catch(function(err) {
            done(err);
          });
        });
      });

      it ("should return proper instance model", function(done){
        Person.find({ name: "John" }, function (err, people) {
          people[0].getPetsAsync("-name").then(function (pets) {
            pets[0].model().should.equal(Pet);
            done();
          }).catch(function(err) {
            done(err);
          })
        });
      });

      it("should allow to specify order as Array", function (done) {
        Person.find({ name: "John" }, function (err, people) {
          should.equal(err, null);

          people[0].getPetsAsync([ "name", "Z" ]).then(function (pets) {

            should(Array.isArray(pets));
            pets.length.should.equal(2);
            pets[0].name.should.equal("Mutt");
            pets[1].name.should.equal("Deco");

            done();
          }).catch(function(err) {
            done(err);
          });
        });
      });

      it("should allow to specify a limit", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          should.equal(err, null);

          John.getPetsAsync(1).then(function (pets) {
            should(Array.isArray(pets));
            pets.length.should.equal(1);

            done();
          }).catch(function(err) {
            done(err);
          });
        });
      });

      it("should allow to specify conditions", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          should.equal(err, null);

          John.getPetsAsync({ name: "Mutt" }).then(function (pets) {

            should(Array.isArray(pets));
            pets.length.should.equal(1);
            pets[0].name.should.equal("Mutt");

            done();
          }).catch(function(err) {
            done(err);
          });
        });
      });

      if (common.protocol() == "mongodb") return;

      it("should allow chaining count()", function (done) {
        Person.find({}, function (err, people) {
          should.equal(err, null);

          people[1].getPetsAsync().then(function (count) {
            should.strictEqual(count.length, 2);

            people[2].getPetsAsync().then(function (count) {

              should.strictEqual(count.length, 1);

              people[3].getPetsAsync().then(function (count) {

                should.strictEqual(count.length, 0);

                done();
              }).catch(function(err) {
                done(err);
              });
            }).catch(function(err) {
              done(err);
            });
          }).catch(function(err){
            done(err);
          });
        });
      });
    });

    describe("hasAccessorAsync", function () {
      before(setup());

      it("should return true if instance has associated item", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          should.equal(err, null);

          Person.find({ name: "Jane" }).first(function (err, Jane) {
            should.equal(err, null);

            Jane.hasPetsAsync(pets[0]).then(function (has_pets) {
              has_pets.should.be.true;
              done();
            }).catch(function(err){
              done(err);
            });
          });
        });
      });

      it("should return true if not passing any instance and has associated items", function (done) {
        Person.find({ name: "Jane" }).first(function (err, Jane) {
          should.equal(err, null);

          Jane.hasPetsAsync().then(function (has_pets) {
            has_pets.should.be.true;
            done();
          }).catch(function(err){
            done(err);
          });
        });
      });

      it("should return true if all passed instances are associated", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "John" }).first(function (err, John) {
            should.equal(err, null);

            John.hasPetsAsync(pets).then(function (has_pets) {
              should.equal(err, null);
              has_pets.should.be.true;
              done();
            }).catch(function(err){
              done(err);
            });
          });
        });
      });

      it("should return false if any passed instances are not associated", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Jane" }).first(function (err, Jane) {
            should.equal(err, null);

            Jane.hasPetsAsync(pets).then(function (has_pets) {
              should.equal(err, null);
              has_pets.should.be.false;

              done();
            }).catch(function(err) {
              done(err);
            });
          });
        });
      });

      if (common.protocol() != "mongodb") {
        it("should return true if join table has duplicate entries", function (done) {
          Pet.find({ name: ["Mutt", "Deco"] }, function (err, pets) {
            should.not.exist(err);
            should.equal(pets.length, 2);

            Person.find({ name: "John" }).first(function (err, John) {
              should.not.exist(err);

              John.hasPets(pets, function (err, hasPets) {
                should.equal(err, null);
                should.equal(hasPets, true);

                db.driver.execQuery(
                  "INSERT INTO person_pets (person_id, pets_id) VALUES (?,?), (?,?)",
                  [John.id, pets[0].id, John.id, pets[1].id],
                  function (err) {
                    should.not.exist(err);

                    John.hasPets(pets, function (err, hasPets) {
                      should.equal(err, null);
                      should.equal(hasPets, true);

                      done()
                    });
                  }
                );
              });
            });
          });
        });
        it("should return true if join table has duplicate entries (promise-based)", function (done) {
          Pet.find({ name: ["Mutt", "Deco"] }, function (err, pets) {
            should.not.exist(err);
            should.equal(pets.length, 2);

            Person.find({ name: "John" }).first(function (err, John) {
              should.not.exist(err);

              John.hasPetsAsync(pets).then(function (hasPets) {
                should.equal(hasPets, true);

                db.driver.execQueryAsync(
                  "INSERT INTO person_pets (person_id, pets_id) VALUES (?,?), (?,?)",
                  [John.id, pets[0].id, John.id, pets[1].id]).then(
                  function () {

                    John.hasPetsAsync(pets).then(function (hasPets) {
                      should.equal(hasPets, true);
                      done();
                    }).catch(function(err){
                      done(err);
                    });
                  }
                ).catch(function(err){
                  done(err);
                });
              }).catch(function(err){
                done(err);
              });
            });
          });
        });
      }
    });

    describe("delAccessorAsync", function () {
      before(setup());

      it("should accept arguments in different orders", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          Person.find({ name: "John" }, function (err, people) {
            should.equal(err, null);

            people[0].removePetsAsync(pets[0]).then(function () {
              people[0].getPetsAsync().then(function (pets) {

                should(Array.isArray(pets));
                pets.length.should.equal(1);
                pets[0].name.should.equal("Deco");

                return done();
              }).catch(function(err) {
                done(err);
              });
            }).catch(function(err) {
              done(err);
            });
          });
        });
      });

      it("should remove specific associations if passed", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          Person.find({ name: "John" }, function (err, people) {
            should.equal(err, null);

            people[0].removePetsAsync(pets[0]).then(function () {
              people[0].getPetsAsync().then(function (pets) {
                should(Array.isArray(pets));
                pets.length.should.equal(1);
                pets[0].name.should.equal("Deco");

                done();
              }).catch(function(err) {
                done(err);
              });
            }).catch(function(err) {
              done(err);
            });
          });
        });
      });

      it("should remove all associations if none passed", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          should.equal(err, null);

          John.removePetsAsync().then(function () {
            John.getPetsAsync().then(function (pets) {

              should(Array.isArray(pets));
              pets.length.should.equal(0);

              done();
            }).catch(function(err) {
              done(err);
            });
          }).catch(function(err){
            done(err);
          });
        });
      });
    });

    describe("addAccessorAsync", function () {
      before(setup());

      if (common.protocol() != "mongodb") {

        it("might add duplicates (promise-based)", function (done) {
          Pet.find({ name: "Mutt" }, function (err, pets) {
            Person.find({ name: "Jane" }, function (err, people) {
              should.equal(err, null);

              people[0].addPetsAsync(pets[0]).then(function () {
                people[0].getPetsAsync("name").then(function (pets) {

                  should(Array.isArray(pets));
                  pets.length.should.equal(2);
                  pets[0].name.should.equal("Mutt");
                  pets[1].name.should.equal("Mutt");

                  done();
                }).catch(function(err){
                  done(err);
                });
              }).catch(function(err){
                done(err);
              });
            });
          });
        });
      }

      it("should keep associations and add new ones", function (done) {
        Pet.find({ name: "Deco" }).first(function (err, Deco) {
          Person.find({ name: "Jane" }).first(function (err, Jane) {
            should.equal(err, null);

            Jane.getPetsAsync().then(function (janesPets) {
              should.not.exist(err);

              var petsAtStart = janesPets.length;

              Jane.addPetsAsync(Deco).then(function () {
                Jane.getPetsAsync("name").then(function (pets) {
                  should(Array.isArray(pets));
                  pets.length.should.equal(petsAtStart + 1);
                  pets[0].name.should.equal("Deco");
                  pets[1].name.should.equal("Mutt");

                  done();
                }).catch(function(err) {
                  done(err);
                });
              }).catch(function(err) {
                done(err);
              });
            }).catch(function(err){
              done(err);
            });
          });
        });
      });

      it("should accept several arguments as associations (promise-based)", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            should.equal(err, null);

            Justin.addPetsAsync(pets[0], pets[1]).then(function () {
              Justin.getPetsAsync().then(function (pets) {

                should(Array.isArray(pets));
                pets.length.should.equal(2);

                done();
              }).catch(function(err){
                done(err);
              });
            }).catch(function(err){
              done(err);
            });
          });
        });
      });

      it("should accept array as list of associations (promise-based)", function (done) {
        Pet.createAsync([{ name: 'Ruff' }, { name: 'Spotty' }]).then(function (pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            should.equal(err, null);

            Justin.getPetsAsync().then(function (justinsPets) {

              var petCount = justinsPets.length;

              Justin.addPetsAsync(pets).then(function () {

                Justin.getPetsAsync().then(function (justinsPets) {

                  should(Array.isArray(justinsPets));
                  // Mongo doesn't like adding duplicates here, so we add new ones.
                  should.equal(justinsPets.length, petCount + 2);

                  done();
                });
              }).catch(function(err){
                done(err);
              });
            }).catch(function(err) {
              done(err);
            });
          });
        }).catch(function(err) {
          done(err);
        });
      });
    });

    describe("setAccessorAsync", function () {
      before(setup());

      it("should accept several arguments as associations", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            should.equal(err, null);

            Justin.setPetsAsync(pets[0], pets[1]).then(function () {
              Justin.getPetsAsync().then(function (pets) {

                should(Array.isArray(pets));
                pets.length.should.equal(2);

                done();
              }).catch(function(err) {
                done(err);
              });
            }).catch(function (err) {
              done(err);
            });
          });
        });
      });

      it("should accept an array of associations", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            should.equal(err, null);

            Justin.setPetsAsync(pets).then(function () {
              Justin.getPetsAsync().then(function (all_pets) {
                should(Array.isArray(all_pets));
                all_pets.length.should.equal(pets.length);

                done();
              }).catch(function(err) {
                done(err);
              });
            }).catch(function(err) {
              done(err);
            });
          });
        });
      });

      it("should remove all associations if an empty array is passed", function (done) {
        Person.find({ name: "Justin" }).first(function (err, Justin) {
          should.equal(err, null);
          Justin.getPetsAsync().then(function (pets) {
            should.equal(pets.length, 4);

            Justin.setPetsAsync([]).then(function () {

              Justin.getPetsAsync().then(function (pets) {
                should.equal(pets.length, 0);

                done();
              }).catch(function(err) {
                done(err);
              });
            }).catch(function(err) {
              done(err);
            });
          }).catch(function(err) {
            done(err);
          });
        });
      });

      it("clears current associations", function (done) {
        Pet.find({ name: "Deco" }, function (err, pets) {
          var Deco = pets[0];

          Person.find({ name: "Jane" }).first(function (err, Jane) {
            should.equal(err, null);

            Jane.getPetsAsync().then(function (pets) {

              should(Array.isArray(pets));
              pets.length.should.equal(1);
              pets[0].name.should.equal("Mutt");

              Jane.setPetsAsync(Deco).then(function () {

                Jane.getPetsAsync().then(function (pets) {

                  should(Array.isArray(pets));
                  pets.length.should.equal(1);
                  pets[0].name.should.equal(Deco.name);

                  done();
                }).catch(function(err) {
                  done(err);
                });
              }).catch(function(err) {
                done(err);
              });
            }).catch(function(err) {
              done(err);
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
        Person.find({ name: "John" }).first(function (err, John) {
          should.equal(err, null);

          John.should.have.property("pets");
          should(Array.isArray(John.pets));
          John.pets.length.should.equal(2);

          return done();
        });
      });

      it("should save existing", function (done) {
        Person.create({ name: 'Bishan' }, function (err) {
          should.not.exist(err);

          Person.one({ name: 'Bishan' }, function (err, person) {
            should.not.exist(err);

            person.surname = 'Dominar';

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
          should.equal(pets.length, 4);

          Person.create({ name: 'Paul' }, function (err, paul) {
            should.not.exist(err);

            Person.one({ name: 'Paul' }, function (err, paul2) {
              should.not.exist(err);
              should.equal(paul2.pets.length, 0);

              paul.setPets(pets, function (err) {
                should.not.exist(err);

                // reload paul to make sure we have 2 pets
                Person.one({ name: 'Paul' }, function (err, paul) {
                  should.not.exist(err);
                  should.equal(paul.pets.length, 4);

                  // Saving paul2 should NOT auto save associations and hence delete
                  // the associations we just created.
                  paul2.save(function (err) {
                    should.not.exist(err);

                    // let's check paul - pets should still be associated
                    Person.one({ name: 'Paul' }, function (err, paul) {
                      should.not.exist(err);
                      should.equal(paul.pets.length, 4);

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
        Person.one({ name: 'John' }, function (err, john) {
          should.not.exist(err);
          should.equal(john.pets.length, 2);

          john.pets = [];

          john.save(function (err) {
            should.not.exist(err);

            // reload john to make sure pets were deleted
            Person.one({ name: 'John' }, function (err, john) {
              should.not.exist(err);
              should.equal(john.pets.length, 0);

              done();
            });
          });
        });
      });

    });
  });

  if (protocol == "mongodb") return;

});
