var async    = require('async');
var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var common   = require('../common');

describe("Model.find() chaining", function() {
  var db = null;
  var Person = null;
  var Dog = null;

  var setup = function (extraOpts) {
    if (!extraOpts) extraOpts = {};

    return function (done) {
      Person = db.define("person", {
        name    : String,
        surname : String,
        age     : Number
      }, extraOpts);
      Person.hasMany("parents");
      Person.hasOne("friend");

      ORM.singleton.clear(); // clear identityCache cache

      return helper.dropSync(Person, function () {
        Person.create([{
          name      : "John",
          surname   : "Doe",
          age       : 18,
          friend_id : 1
        }, {
          name      : "Jane",
          surname   : "Doe",
          age       : 20,
          friend_id : 1
        }, {
          name      : "Jane",
          surname   : "Dean",
          age       : 18,
          friend_id : 1
        }], done);
      });
    };
  };

  var setup2 = function () {
    return function (done) {
      Dog = db.define("dog", {
        name: String,
      });
      Dog.hasMany("friends");
      Dog.hasMany("family");

      ORM.singleton.clear(); // clear identityCache cache

      return helper.dropSync(Dog, function () {
        Dog.create([{
          name    : "Fido",
          friends : [{ name: "Gunner" }, { name: "Chainsaw" }],
          family  : [{ name: "Chester" }]
        }, {
          name    : "Thumper",
          friends : [{ name: "Bambi" }],
          family  : [{ name: "Princess" }, { name: "Butch" }]
        }], done);
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

  describe(".firstAsync()", function () {
    before(setup());

    it("should return only the first element", function () {
      return Person.find()
        .order("-age")
        .firstAsync()
        .then(function (JaneDoe) {
          JaneDoe.name.should.equal("Jane");
          JaneDoe.surname.should.equal("Doe");
          JaneDoe.age.should.equal(20);
        });
    });

    it("should return null if not found", function () {
      return Person.find({ name: "Jack" })
        .firstAsync()
        .then(function (Jack) {
          should.equal(Jack, null);
        });
    });
  });

  describe(".lastAsync()", function () {
    before(setup());

    it("should return only the last element", function () {
      return Person.find()
        .order("age")
        .lastAsync()
        .then(function (JaneDoe) {
          JaneDoe.name.should.equal("Jane");
          JaneDoe.surname.should.equal("Doe");
          JaneDoe.age.should.equal(20);
        });
    });

    it("should return null if not found", function () {
      return Person.find({ name: "Jack" })
        .lastAsync()
        .then(function (Jack) {
          should.equal(Jack, null);
        });
    });
  });

  describe(".findAsync()", function () {
    before(setup());

    it("should not change find if no arguments", function () {
      return Person.find()
        .findAsync()
        .then(function(person) {
          should.equal(person.length, 3);
        });
    });

    it("should restrict conditions if passed", function () {
      return Person.find()
        .findAsync({ age: 18 })
        .then(function(person) {
          should.equal(person.length, 2);
        });
    });

    if (common.protocol() == "mongodb") return;

  });

  describe(".removeAsync()", function () {
    var hookFired = false;

    before(setup({
      hooks: {
        beforeRemove: function () {
          hookFired = true;
        }
      }
    }));

    it("should have no problems if no results found", function () {
      return Person.find({ age: 22 })
        .removeAsync()
        .then(function () {
          return Person.find().findAsync();
        }).then(function(person) {
          should.equal(person.length, 3);
        });
    });

    it("should remove results without calling hooks", function () {
      return Person.find({ age: 20 })
        .removeAsync()
        .then(function () {
          should.equal(hookFired, false);
          return Person.find().findAsync();
        })
        .then(function(person) {
          should.equal(person.length, 2);
        });
    });
  });

  describe(".allAsync()", function () {
    before(setup());

    it("should return all records without any restriction", function () {
      return Person.find()
        .allAsync()
        .then(function(persons) {
          should.equal(persons.length, 3);
        });
    });

    it("should restrict conditions from pervious chain calls", function () {
      return Person.find({ age: 18 })
        .order('-name')
        .allAsync()
        .then(function(persons) {
          should.equal(persons.length, 2);
          should.equal(persons[0].name, 'John');
          should.equal(persons[1].name, 'Jane');
        });
    });
  });

  describe(".whereAsync()", function () {
    before(setup());

    it("should return all records without any restriction", function () {
      return Person.find()
        .whereAsync()
        .then(function(persons) {
          should.equal(persons.length, 3);
        });
    });

    it("should restrict conditions from pervious chain calls", function () {
      return Person.find({ age: 18 })
        .order('-name')
        .whereAsync()
        .then(function(persons) {
          should.equal(persons.length, 2);
          should.equal(persons[0].name, 'John');
          should.equal(persons[1].name, 'Jane');
        });
    });
  });
});
