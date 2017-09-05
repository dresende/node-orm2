var should   = require('should');
var Promise  = require('bluebird');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');

describe("Model.getAsync()", function () {
  var db     = null;
  var Person = null;
  var John;

  var setup = function (identityCache) {
    return function (done) {
      Person = db.define("person", {
        name     : { type: 'text', mapsTo: 'fullname' }
      }, {
        identityCache : identityCache,
        methods  : {
          UID: function () {
            return this[Person.id];
          }
        }
      });

      ORM.singleton.clear(); // clear identityCache cache

      return helper.dropSync(Person, function () {
        Person.create([{
          name: "John Doe"
        }, {
          name: "Jane Doe"
        }], function (err, people) {
          if (err) done(err);
          John = people[0];

          return done();
        });
      });
    };
  };

  before(function (done) {
    helper.connect(function (connection) {
      db = connection;

      return done();
    });
  });

  after(function () {
    return db.close();
  });

  describe('with identityCache cache', function () {
    before(setup(true));

    it("should throw if passed a wrong number of ids", function (done) {
      Person.getAsync(1, 2)
        .then(function () {
          done(new Error('Fail'));
        })
        .catch(function () {
          done();
        });
    });

    it("should accept and try to fetch if passed an Array with ids", function (done) {
      Person.getAsync([ John[Person.id] ])
        .then(function (John) {
          John.should.be.a.Object();
          John.should.have.property(Person.id, John[Person.id]);
          John.should.have.property("name", "John Doe");
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("should throw err", function (done) {
      Person.getAsync(999)
        .then(function () {
          done(new Error('Fail!'));
        })
        .catch(function (err) {
          err.should.be.a.Object();
          err.message.should.equal("Not found");
          done();
        });
    });

    it("should return item with id 1", function (done) {
      Person.getAsync(John[Person.id])
        .then(function (John) {
          John.should.be.a.Object();
          John.should.have.property(Person.id, John[Person.id]);
          John.should.have.property("name", "John Doe");

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("should have an UID method", function (done) {
      Person.getAsync(John[Person.id])
        .then(function (John) {
          John.UID.should.be.a.Function();
          John.UID().should.equal(John[Person.id]);

          done();
        })
        .catch(function (err) {
          done(err)
        });
    });

    it("should return the original object with unchanged name", function (done) {
      Person.getAsync(John[Person.id])
        .then(function (John1) {
          John1.name = "James";
          return Person.getAsync(John[Person.id]);
        })
        .then(function (John2) {
          should.equal(John2.name, "John Doe");
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    describe("changing instance.identityCacheSaveCheck = false", function () {
      before(function () {
        Person.settings.set("instance.identityCacheSaveCheck", false);
      });

      it("should return the same object with the changed name", function (done) {
        Person.getAsync(John[Person.id])
          .then(function (John1) {
            John1.name = "James";
            return [John1, Person.getAsync(John[Person.id])];
          })
          .spread(function (John1, John2) {
            John1[Person.id].should.equal(John2[Person.id]);
            John2.name.should.equal("James");

            done();
          })
          .catch(function (err) {
            done(err);
          });
      });
    });
  });

  describe("with no identityCache cache", function () {
    before(setup(false));

    it("should return different objects", function (done) {
      Person.getAsync(John[Person.id])
        .then(function (John1) {
          return [John1, Person.getAsync(John[Person.id])];
        })
        .spread(function (John1, John2) {
          John1[Person.id].should.equal(John2[Person.id]);
          John1.should.not.equal(John2);

          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe("with identityCache cache = 0.5 secs", function () {
    before(setup(0.5));

    it("should return same objects after 0.2 sec", function (done) {
      Person.getAsync(John[Person.id])
        .then(function (John1) {
          return [John1, Promise.delay(200)];
        })
        .spread(function (John1) {
          return [John1, Person.getAsync(John[Person.id])];
        })
        .spread(function (John1, John2) {
          John1[Person.id].should.equal(John2[Person.id]);
          John1.should.equal(John2);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("should return different objects after 0.7 sec", function (done) {
      Person.getAsync(John[Person.id])
        .then(function (John1) {
          return [John1, Promise.delay(700)];
        })
        .spread(function (John1) {
          return [John1, Person.getAsync(John[Person.id])];
        })
        .spread(function (John1, John2) {
          John1.should.not.equal(John2);
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe("if primary key name is changed", function () {
    before(function (done) {
      Person = db.define("person", {
        name : String
      });

      ORM.singleton.clear();

      return helper.dropSync(Person, function () {
        Person.create([{
          name : "John Doe"
        }, {
          name : "Jane Doe"
        }], done);
      });
    });

    it("should search by key name and not 'id'", function (done) {
      db.settings.set('properties.primary_key', 'name');

      var OtherPerson = db.define("person", {
        id : Number
      });

      OtherPerson.getAsync("Jane Doe")
        .then(function (person) {
          person.name.should.equal("Jane Doe");
          db.settings.set('properties.primary_key', 'id');
          done();
        });
    });
  });

  describe("with empty object as options", function () {
    before(setup());

    it("should return item with id 1 like previously", function (done) {
      Person.getAsync(John[Person.id], {})
        .then(function (John) {
          John.should.be.a.Object();
          John.should.have.property(Person.id, John[Person.id]);
          John.should.have.property("name", "John Doe");
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });
});