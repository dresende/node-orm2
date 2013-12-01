var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.remove()", function() {
  var db = null;
  var Person = null;

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name   : String
      });

      return helper.dropSync(Person, function () {
        Person.create([{
          id  : 1,
          name: "Jeremy Doe"
        }, {
          id  : 2,
          name: "John Doe"
        }, {
          id  : 3,
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

  describe("mockable", function() {
    before(setup());

    it("remove should be writable", function(done) {
      var John = new Person({
        name: "John"
      });
      var removeCalled = false;
      John.remove = function(cb) {
        removeCalled = true;
        cb(null);
      };
      John.remove(function(err) {
        should.equal(removeCalled,true);
        return done();
      });
    });
  });
});
