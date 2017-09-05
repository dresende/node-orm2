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

    describe("getAccessor", function () {
      before(setup());

      it("should allow to specify order as string", function (done) {
        Person.find({ name: "John" }, function (err, people) {
          should.equal(err, null);

          people[0].getPets("-name", function (err, pets) {
            should.equal(err, null);

            should(Array.isArray(pets));
            pets.length.should.equal(2);
            pets[0].model().should.equal(Pet);
            pets[0].name.should.equal("Mutt");
            pets[1].name.should.equal("Deco");

            return done();
          });
        });
      });

       it ("should return proper instance model", function(done){
         Person.find({ name: "John" }, function (err, people) {
          people[0].getPets("-name", function (err, pets) {
            pets[0].model().should.equal(Pet);
            return done();
          });
        });
       });

      it("should allow to specify order as Array", function (done) {
        Person.find({ name: "John" }, function (err, people) {
          should.equal(err, null);

          people[0].getPets([ "name", "Z" ], function (err, pets) {
            should.equal(err, null);

            should(Array.isArray(pets));
            pets.length.should.equal(2);
            pets[0].name.should.equal("Mutt");
            pets[1].name.should.equal("Deco");

            return done();
          });
        });
      });

      it("should allow to specify a limit", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          should.equal(err, null);

          John.getPets(1, function (err, pets) {
            should.equal(err, null);

            should(Array.isArray(pets));
            pets.length.should.equal(1);

            return done();
          });
        });
      });

      it("should allow to specify conditions", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          should.equal(err, null);

          John.getPets({ name: "Mutt" }, function (err, pets) {
            should.equal(err, null);

            should(Array.isArray(pets));
            pets.length.should.equal(1);
            pets[0].name.should.equal("Mutt");

            return done();
          });
        });
      });

      if (common.protocol() == "mongodb") return;

      it("should return a chain if no callback defined", function (done) {
        Person.find({ name: "John" }, function (err, people) {
          should.equal(err, null);

          var chain = people[0].getPets({ name: "Mutt" });

          chain.should.be.a.Object();
          chain.find.should.be.a.Function();
          chain.only.should.be.a.Function();
          chain.limit.should.be.a.Function();
          chain.order.should.be.a.Function();

          return done();
        });
      });

      it("should allow chaining count()", function (done) {
        Person.find({}, function (err, people) {
          should.equal(err, null);

          people[1].getPets().count(function (err, count) {
            should.not.exist(err);

            should.strictEqual(count, 2);

            people[2].getPets().count(function (err, count) {
              should.not.exist(err);

              should.strictEqual(count, 1);

              people[3].getPets().count(function (err, count) {
                should.not.exist(err);

                should.strictEqual(count, 0);

                return done();
              });
            });
          });
        });
      });
    });

    describe("hasAccessor", function () {
      before(setup());

      it("should return true if instance has associated item", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          should.equal(err, null);

          Person.find({ name: "Jane" }).first(function (err, Jane) {
            should.equal(err, null);

            Jane.hasPets(pets[0], function (err, has_pets) {
              should.equal(err, null);
              has_pets.should.be.true;

              return done();
            });
          });
        });
      });

      it("should return true if not passing any instance and has associated items", function (done) {
        Person.find({ name: "Jane" }).first(function (err, Jane) {
          should.equal(err, null);

          Jane.hasPets(function (err, has_pets) {
            should.equal(err, null);
            has_pets.should.be.true;

            return done();
          });
        });
      });

      it("should return true if all passed instances are associated", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "John" }).first(function (err, John) {
            should.equal(err, null);

            John.hasPets(pets, function (err, has_pets) {
              should.equal(err, null);
              has_pets.should.be.true;

              return done();
            });
          });
        });
      });

      it("should return false if any passed instances are not associated", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Jane" }).first(function (err, Jane) {
            should.equal(err, null);

            Jane.hasPets(pets, function (err, has_pets) {
              should.equal(err, null);
              has_pets.should.be.false;

              return done();
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
                ).catch(function(err) {
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

    describe("delAccessor", function () {
      before(setup());

      it("should accept arguments in different orders", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          Person.find({ name: "John" }, function (err, people) {
            should.equal(err, null);

            people[0].removePets(function (err) {
              should.equal(err, null);

              people[0].getPets(function (err, pets) {
                should.equal(err, null);

                should(Array.isArray(pets));
                pets.length.should.equal(1);
                pets[0].name.should.equal("Deco");

                return done();
              });
            }, pets[0]);
          });
        });
      });

      it("should remove specific associations if passed", function (done) {
        Pet.find({ name: "Mutt" }, function (err, pets) {
          Person.find({ name: "John" }, function (err, people) {
            should.equal(err, null);

            people[0].removePets(pets[0], function (err) {
              should.equal(err, null);

              people[0].getPets(function (err, pets) {
                should.equal(err, null);

                should(Array.isArray(pets));
                pets.length.should.equal(1);
                pets[0].name.should.equal("Deco");

                return done();
              });
            });
          });
        });
      });

      it("should remove all associations if none passed", function (done) {
        Person.find({ name: "John" }).first(function (err, John) {
          should.equal(err, null);

          John.removePets(function (err) {
            should.equal(err, null);

            John.getPets(function (err, pets) {
              should.equal(err, null);

              should(Array.isArray(pets));
              pets.length.should.equal(0);

              return done();
            });
          });
        });
      });
    });

    describe("addAccessor", function () {
      before(setup());

      if (common.protocol() != "mongodb") {
        it("might add duplicates", function (done) {
          Pet.find({ name: "Mutt" }, function (err, pets) {
            Person.find({ name: "Jane" }, function (err, people) {
              should.equal(err, null);

              people[0].addPets(pets[0], function (err) {
                should.equal(err, null);

                people[0].getPets("name", function (err, pets) {
                  should.equal(err, null);

                  should(Array.isArray(pets));
                  pets.length.should.equal(2);
                  pets[0].name.should.equal("Mutt");
                  pets[1].name.should.equal("Mutt");

                  return done();
                });
              });
            });
          });
        });
      }

      it("should keep associations and add new ones", function (done) {
        Pet.find({ name: "Deco" }).first(function (err, Deco) {
          Person.find({ name: "Jane" }).first(function (err, Jane) {
            should.equal(err, null);

            Jane.getPets(function (err, janesPets) {
              should.not.exist(err);

              var petsAtStart = janesPets.length;

              Jane.addPets(Deco, function (err) {
                should.equal(err, null);

                Jane.getPets("name", function (err, pets) {
                  should.equal(err, null);

                  should(Array.isArray(pets));
                  pets.length.should.equal(petsAtStart + 1);
                  pets[0].name.should.equal("Deco");
                  pets[1].name.should.equal("Mutt");

                  return done();
                });
              });
            });
          });
        });
      });

      it("should accept several arguments as associations", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            should.equal(err, null);

            Justin.addPets(pets[0], pets[1], function (err) {
              should.equal(err, null);

              Justin.getPets(function (err, pets) {
                should.equal(err, null);

                should(Array.isArray(pets));
                pets.length.should.equal(2);

                return done();
              });
            });
          });
        });
      });

      it("should accept array as list of associations", function (done) {
        Pet.create([{ name: 'Ruff' }, { name: 'Spotty' }],function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            should.equal(err, null);

            Justin.getPets(function (err, justinsPets) {
              should.equal(err, null);

              var petCount = justinsPets.length;

              Justin.addPets(pets, function (err) {
                should.equal(err, null);

                Justin.getPets(function (err, justinsPets) {
                  should.equal(err, null);

                  should(Array.isArray(justinsPets));
                  // Mongo doesn't like adding duplicates here, so we add new ones.
                  should.equal(justinsPets.length, petCount + 2);

                  return done();
                });
              });
            });
          });
        });
      });

      it("should throw if no items passed", function (done) {
        Person.one(function (err, person) {
          should.equal(err, null);

          (function () {
            person.addPets(function () {});
          }).should.throw();

          return done();
        });
      });
    });

    describe("setAccessor", function () {
      before(setup());

      it("should accept several arguments as associations", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            should.equal(err, null);

            Justin.setPets(pets[0], pets[1], function (err) {
              should.equal(err, null);

              Justin.getPets(function (err, pets) {
                should.equal(err, null);

                should(Array.isArray(pets));
                pets.length.should.equal(2);

                return done();
              });
            });
          });
        });
      });

      it("should accept an array of associations", function (done) {
        Pet.find(function (err, pets) {
          Person.find({ name: "Justin" }).first(function (err, Justin) {
            should.equal(err, null);

            Justin.setPets(pets, function (err) {
              should.equal(err, null);

              Justin.getPets(function (err, all_pets) {
                should.equal(err, null);

                should(Array.isArray(all_pets));
                all_pets.length.should.equal(pets.length);

                return done();
              });
            });
          });
        });
      });

      it("should remove all associations if an empty array is passed", function (done) {
        Person.find({ name: "Justin" }).first(function (err, Justin) {
          should.equal(err, null);
          Justin.getPets(function (err, pets) {
            should.equal(err, null);
            should.equal(pets.length, 4);

            Justin.setPets([], function (err) {
              should.equal(err, null);

              Justin.getPets(function (err, pets) {
                should.equal(err, null);
                should.equal(pets.length, 0);

                return done();
              });
            });
          });
        });
      });

      it("clears current associations", function (done) {
        Pet.find({ name: "Deco" }, function (err, pets) {
          var Deco = pets[0];

          Person.find({ name: "Jane" }).first(function (err, Jane) {
            should.equal(err, null);

            Jane.getPets(function (err, pets) {
              should.equal(err, null);

              should(Array.isArray(pets));
              pets.length.should.equal(1);
              pets[0].name.should.equal("Mutt");

              Jane.setPets(Deco, function (err) {
                should.equal(err, null);

                Jane.getPets(function (err, pets) {
                  should.equal(err, null);

                  should(Array.isArray(pets));
                  pets.length.should.equal(1);
                  pets[0].name.should.equal(Deco.name);

                  return done();
                });
              });
            });
          });
        });
      });
    });

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

  describe("with non-standard keys", function () {
    var Email;
    var Account;

    setup = function (opts, done) {
      Email = db.define('email', {
        text         : { type: 'text', key: true, required: true },
        bounced      : Boolean
      });

      Account = db.define('account', {
        name: String
      });

      Account.hasMany('emails', Email, {}, { key: opts.key });

      helper.dropSync([ Email, Account ], function (err) {
        should.not.exist(err);
        done()
      });
    };

    it("should place ids in the right place", function (done) {
      setup({}, function (err) {
        should.not.exist(err);

        Email.create([{bounced: true, text: 'a@test.com'}, {bounced: false, text: 'z@test.com'}], function (err, emails) {
          should.not.exist(err);

          Account.create({ name: "Stuff" }, function (err, account) {
            should.not.exist(err);

            account.addEmails(emails[1], function (err) {
              should.not.exist(err);

              db.driver.execQuery("SELECT * FROM account_emails", function (err, data) {
                should.not.exist(err);

                should.equal(data[0].account_id, 1);
                should.equal(data[0].emails_text, 'z@test.com');

                done();
              });
            });
          });
        });
      });
    });

    it("should generate correct tables", function (done) {
      setup({}, function (err) {
        should.not.exist(err);

        var sql;

        if (protocol == 'sqlite') {
          sql = "PRAGMA table_info(?)";
        } else {
          sql = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY data_type";
        }

        db.driver.execQuery(sql, ['account_emails'], function (err, cols) {
          should.not.exist(err);

          if (protocol == 'sqlite') {
            should.equal(cols[0].name, 'account_id');
            should.equal(cols[0].type, 'INTEGER');
            should.equal(cols[1].name, 'emails_text');
            should.equal(cols[1].type, 'TEXT');
          } else if (protocol == 'mysql') {
            should.equal(cols[0].column_name, 'account_id');
            should.equal(cols[0].data_type,   'int');
            should.equal(cols[1].column_name, 'emails_text');
            should.equal(cols[1].data_type,    'varchar');
          } else if (protocol == 'postgres') {
            should.equal(cols[0].column_name, 'account_id');
            should.equal(cols[0].data_type,   'integer');
            should.equal(cols[1].column_name, 'emails_text');
            should.equal(cols[1].data_type,   'text');
          }

          done();
        });
      });
    });

    it("should add a composite key to the join table if requested", function (done) {
      setup({ key: true }, function (err) {
        should.not.exist(err);
        var sql;

        if (protocol == 'postgres' || protocol === 'redshift') {
          sql = "" +
            "SELECT c.column_name, c.data_type " +
            "FROM  information_schema.table_constraints tc " +
            "JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) " +
            "JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name " +
            "WHERE constraint_type = ? AND tc.table_name = ? " +
            "ORDER BY column_name";

          db.driver.execQuery(sql, ['PRIMARY KEY', 'account_emails'], function (err, data) {
            should.not.exist(err);

            should.equal(data.length, 2);
            should.equal(data[0].column_name, 'account_id');
            should.equal(data[1].column_name, 'emails_text');

            done()
          });
        } else if (protocol == 'mysql') {
          db.driver.execQuery("SHOW KEYS FROM ?? WHERE Key_name = ?", ['account_emails', 'PRIMARY'], function (err, data) {
            should.not.exist(err);

            should.equal(data.length, 2);
            should.equal(data[0].Column_name, 'account_id');
            should.equal(data[0].Key_name, 'PRIMARY');
            should.equal(data[1].Column_name, 'emails_text');
            should.equal(data[1].Key_name, 'PRIMARY');

            done();
          });
        } else if (protocol == 'sqlite') {
          db.driver.execQuery("pragma table_info(??)", ['account_emails'], function (err, data) {
            should.not.exist(err);

            should.equal(data.length, 2);
            should.equal(data[0].name, 'account_id');
            should.equal(data[0].pk, 1);
            should.equal(data[1].name, 'emails_text');
            should.equal(data[1].pk, 2);

            done();
          });
        }
      });
    });
  });
});
