var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.findAsync()", function() {
  var db = null;
  var Person = null;

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name    : String,
        surname : String,
        age     : Number,
        male    : Boolean
      });

      return helper.dropSync(Person, function () {
        Person.create([{
          name    : "John",
          surname : "Doe",
          age     : 18,
          male    : true
        }, {
          name    : "Jane",
          surname : "Doe",
          age     : 16,
          male    : false
        }, {
          name    : "Jeremy",
          surname : "Dean",
          age     : 18,
          male    : true
        }, {
          name    : "Jack",
          surname : "Dean",
          age     : 20,
          male    : true
        }, {
          name    : "Jasmine",
          surname : "Doe",
          age     : 20,
          male    : false
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

  describe("without arguments", function () {
    before(setup());

    it("should return all items", function () {
      return Person.findAsync()
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 5);
        });
    });
  });

  describe("with a number as argument", function () {
    before(setup());

    it("should use it as limit", function () {
      return Person.findAsync(2)
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 2);
        });
    });
  });

  describe("with a string argument", function () {
    before(setup());

    it("should use it as property ascending order", function () {
      return Person.findAsync("age")
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 5);
          people[0].age.should.equal(16);
          people[4].age.should.equal(20);
        });
    });

    it("should use it as property descending order if starting with '-'", function () {
      return Person.findAsync("-age")
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 5);
          people[0].age.should.equal(20);
          people[4].age.should.equal(16);
        });
    });
  });

  describe("with an Array as argument", function () {
    before(setup());

    it("should use it as property ascending order", function () {
      return Person.findAsync([ "age" ])
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 5);
          people[0].age.should.equal(16);
          people[4].age.should.equal(20);
      });
    });

    it("should use it as property descending order if starting with '-'", function () {
      return Person.findAsync([ "-age" ])
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 5);
          people[0].age.should.equal(20);
          people[4].age.should.equal(16);
      });
    });

    it("should use it as property descending order if element is 'Z'", function () {
      return Person.findAsync([ "age", "Z" ])
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 5);
          people[0].age.should.equal(20);
          people[4].age.should.equal(16);
      });
    });

    it("should accept multiple ordering", function () {
      return Person.findAsync([ "age", "name", "Z" ])
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 5);
          people[0].age.should.equal(16);
          people[4].age.should.equal(20);
      });
    });

    it("should accept multiple ordering using '-' instead of 'Z'", function () {
      return Person.findAsync([ "age", "-name" ])
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 5);
          people[0].age.should.equal(16);
          people[4].age.should.equal(20);
      });
    });
  });

  describe("with an Object as argument", function () {
    before(setup());

    it("should use it as conditions", function () {
      return Person.findAsync({ age: 16 })
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 1);
          people[0].age.should.equal(16);
        });
    });

    it("should accept comparison objects", function () {
      return Person.findAsync({ age: ORM.gt(18) })
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 2);
          people[0].age.should.equal(20);
          people[1].age.should.equal(20);
        });
    });

    describe("with another Object as argument", function () {
      before(setup());

      it("should use it as options", function () {
        return Person.findAsync({ age: 18 }, 1, { cache: false })
          .then(function (people) {
            people.should.be.a.Object();
            people.should.have.property("length", 1);
            people[0].age.should.equal(18);


          });
      });

      describe("if a limit is passed", function () {
        before(setup());

        it("should use it", function () {
          return Person.findAsync({ age: 18 }, { limit: 1 })
            .then(function (people) {
              people.should.be.a.Object();
              people.should.have.property("length", 1);
              people[0].age.should.equal(18);


            });
        });
      });

      describe("if an offset is passed", function () {
        before(setup());

        it("should use it", function () {
          return Person.findAsync({}, { offset: 1 }, "age")
            .then(function (people) {
              people.should.be.a.Object();
              people.should.have.property("length", 4);
              people[0].age.should.equal(18);


            });
        });
      });

      describe("if an order is passed", function () {
        before(setup());

        it("should use it", function () {
          return Person.findAsync({ surname: "Doe" }, { order: "age" })
            .then(function (people) {
              people.should.be.a.Object();
              people.should.have.property("length", 3);
              people[0].age.should.equal(16);


            });
        });

        it("should use it and ignore previously defined order", function () {
          return Person.findAsync({ surname: "Doe" }, "-age", { order: "age" })
            .then(function (people) {
              people.should.be.a.Object();
              people.should.have.property("length", 3);
              people[0].age.should.equal(16);


            });
        });
      });
    });
  });

  describe("with identityCache disabled", function () {
    before(setup());
    it("should not return singletons", function () {
      return Person.findAsync({ name: "Jasmine" }, { identityCache: false })
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 1);
          people[0].name.should.equal("Jasmine");
          people[0].surname.should.equal("Doe");

          people[0].surname = "Dux";

          return Person.findAsync({ name: "Jasmine" }, { identityCache: false });
        })
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 1);
          people[0].name.should.equal("Jasmine");
          people[0].surname.should.equal("Doe");
        });
    });
  });

  describe("when using Model.allAsync()", function () {
    before(setup());
    it("should work exactly the same", function () {
      return Person.allAsync({ surname: "Doe" }, "-age", 1)
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 1);
          people[0].name.should.equal("Jasmine");
          people[0].surname.should.equal("Doe");
        });
    });
  });

  describe("when using Model.whereAsync()", function () {
    before(setup());
    it("should work exactly the same", function () {
      return Person.whereAsync({ surname: "Doe" }, "-age", 1)
        .then(function (people) {
          people.should.be.a.Object();
          people.should.have.property("length", 1);
          people[0].name.should.equal("Jasmine");
          people[0].surname.should.equal("Doe");
        });
    });
  });
});
