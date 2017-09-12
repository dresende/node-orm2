var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.clearAsync()", function() {
  var db = null;
  var Person = null;

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name   : String
      });

      ORM.singleton.clear();

      return helper.dropSync(Person, function () {
        Person.create([{
          name: "John Doe"
        }, {
          name: "Jane Doe"
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

  describe("with callback", function () {
    before(setup());

    it("should call when done", function () {
      return Person.clearAsync()
        .then(Person.countAsync)
        .then(function (count) {
          should.equal(count, 0);
        });
    });
  });

  describe("without callback", function () {
    before(setup());

    it("should still remove", function () {
      return Person.clearAsync()
        .then(Person.countAsync)
        .then(function (count) {
          should.equal(count, 0);
        });
    });
  });
});
