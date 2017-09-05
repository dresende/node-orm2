var should   = require('should');
var helper   = require('../support/spec_helper');

describe("Model.createAsync()", function() {
  var db = null;
  var Pet = null;
  var Person = null;

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name   : String
      });
      Pet = db.define("pet", {
        name   : { type: "text", defaultValue: "Mutt" }
      });
      Person.hasMany("pets", Pet);

      return helper.dropSync([ Person, Pet ], done);
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

  describe("if passing an object", function () {
    before(setup());

    it("should accept it as the only item to create", function (done) {
      Person.createAsync({
        name : "John Doe"
      })
        .then(function (John) {
          John.should.have.property("name", "John Doe");
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe("if passing an array", function () {
    before(setup());

    it("should accept it as a list of items to create", function (done) {
      Person.createAsync([{
        name : "John Doe"
      }, {
        name : "Jane Doe"
      }])
        .then(function (people) {
          should(Array.isArray(people));

          people.should.have.property("length", 2);
          people[0].should.have.property("name", "John Doe");
          people[1].should.have.property("name", "Jane Doe");
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe("if element has an association", function () {
    before(setup());

    it("should also create it or save it", function (done) {
      Person.createAsync({
        name : "John Doe",
        pets : [ new Pet({ name: "Deco" }) ]
      })
        .then(function (John) {
          John.should.have.property("name", "John Doe");

          should(Array.isArray(John.pets));

          John.pets[0].should.have.property("name", "Deco");
          John.pets[0].should.have.property(Pet.id);
          John.pets[0].saved().should.be.true;
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("should also create it or save it even if it's an object and not an instance", function (done) {
      Person.createAsync({
        name : "John Doe",
        pets : [ { name: "Deco" } ]
      })
        .then(function (John) {
          John.should.have.property("name", "John Doe");

          should(Array.isArray(John.pets));

          John.pets[0].should.have.property("name", "Deco");
          John.pets[0].should.have.property(Pet.id);
          John.pets[0].saved().should.be.true;
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe("when not passing a property", function () {
    before(setup());

    it("should use defaultValue if defined", function (done) {
      Pet.createAsync({})
        .then(function (Mutt) {
          Mutt.should.have.property("name", "Mutt");
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });
});
