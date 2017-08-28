var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.extendsTo()", function() {
  var db = null;
  var Person = null;
  var PersonAddress = null;

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name   : String
      });
      PersonAddress = Person.extendsTo("address", {
        street : String,
        number : Number
      });

      ORM.singleton.clear();

      return helper.dropSync([ Person, PersonAddress ], function () {
        Person.create({
          name: "John Doe"
        }, function (err, person) {
          should.not.exist(err);

          return person.setAddress(new PersonAddress({
            street : "Liberty",
            number : 123
          }), done);
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

  describe("when calling hasAccessor", function () {
    before(setup());

    it("should return true if found", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.hasAddress(function (err, hasAddress) {
          should.equal(err, null);
          hasAddress.should.equal(true);

          return done();
        });
      });
    });

    it("should return false if not found", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.removeAddress(function () {
          John.hasAddress(function (err, hasAddress) {
            err.should.be.a.Object();
            hasAddress.should.equal(false);

            return done();
          });
        });
      });
    });

    it("should return error if instance not with an ID", function (done) {
      var Jane = new Person({
        name: "Jane"
      });
      Jane.hasAddress(function (err, hasAddress) {
        err.should.be.a.Object();
        err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);

        return done();
      });
    });
  });

  describe("when calling getAccessor", function () {
    before(setup());

    it("should return extension if found", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.getAddress(function (err, Address) {
          should.equal(err, null);
          Address.should.be.a.Object();
          Address.should.have.property("street", "Liberty");

          return done();
        });
      });
    });

    it("should return error if not found", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.removeAddress(function () {
          John.getAddress(function (err, Address) {
            err.should.be.a.Object();
            err.should.have.property("code", ORM.ErrorCodes.NOT_FOUND);

            return done();
          });
        });
      });
    });

    it("should return error if instance not with an ID", function (done) {
      var Jane = new Person({
        name: "Jane"
      });
      Jane.getAddress(function (err, Address) {
        err.should.be.a.Object();
        err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);

        return done();
      });
    });
  });

  describe("when calling setAccessor", function () {
    before(setup());

    it("should remove any previous extension", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        PersonAddress.find({ number: 123 }).count(function (err, c) {
          should.equal(err, null);
          c.should.equal(1);

          var addr = new PersonAddress({
            street : "4th Ave",
            number : 4
          });

          John.setAddress(addr, function (err) {
            should.equal(err, null);

            John.getAddress(function (err, Address) {
              should.equal(err, null);
              Address.should.be.a.Object();
              Address.should.have.property("street", addr.street);

              PersonAddress.find({ number: 123 }).count(function (err, c) {
                should.equal(err, null);
                c.should.equal(0);

                return done();
              });
            });
          });
        });
      });
    });
  });

  describe("when calling delAccessor", function () {
    before(setup());

    it("should remove any extension", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        PersonAddress.find({ number: 123 }).count(function (err, c) {
          should.equal(err, null);
          c.should.equal(1);

          var addr = new PersonAddress({
            street : "4th Ave",
            number : 4
          });

          John.removeAddress(function (err) {
            should.equal(err, null);

            PersonAddress.find({ number: 123 }).count(function (err, c) {
              should.equal(err, null);
              c.should.equal(0);

              return done();
            });
          });
        });
      });
    });

    it("should return error if instance not with an ID", function (done) {
      var Jane = new Person({
        name: "Jane"
      });
      Jane.removeAddress(function (err) {
        err.should.be.a.Object();
        err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);

        return done();
      });
    });
  });

  describe("when calling hasAccessor + Async", function () {
    before(setup());

    it("should return true if found", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.hasAddressAsync().then(function (hasAddress) {
          should.equal(err, null);
          hasAddress.should.equal(true);

          done();
        }).catch(function(err){
          done(err);
        });
      });
    });

    it("should return false if not found", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);
        John.removeAddressAsync().then(function(){
          John.hasAddressAsync().then(function (hasAddress) {
          }).catch(function(err) {
            err.should.be.a.Object();
            done();
          });
        });
      });
    });

    it("should return error if instance not with an ID", function (done) {
      var Jane = new Person({
        name: "Jane"
      });
      Jane.hasAddressAsync().catch(function(err) {
        err.should.be.a.Object();
        err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);
        done();
      });
    });
  });

  describe("when calling getAccessor + Async", function () {
    before(setup());

    it("should return extension if found", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.getAddressAsync(John).then(function (Address) {
          Address.should.be.a.Object();
          Address.should.have.property("street", "Liberty");
          done();
        }).catch(function (err) {
          done(err);
        });
      });
    });

    it("should return error if not found", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);
        John.removeAddressAsync().then(function () {
          John.getAddressAsync(John).catch(function(err){
            err.should.be.a.Object();
            err.should.have.property("code", ORM.ErrorCodes.NOT_FOUND);
            done();
          });
        });
      });
    });

    it("should return error if instance not with an ID", function (done) {
      var Jane = new Person({
        name: "Jane"
      });
      Jane.getAddressAsync().catch(function(err) {
        err.should.be.a.Object();
        err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);
        done();
      });
    });
  });

  describe("when calling setAccessor + Async", function () {
    before(setup());

    it("should remove any previous extension", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        PersonAddress.find({ number: 123 }).count(function (err, c) {
          should.equal(err, null);
          c.should.equal(1);

          var addr = new PersonAddress({
            street : "4th Ave",
            number : 4
          });

          John.setAddressAsync(addr).then(function () {
            John.getAddressAsync(addr).then(function (Address) {
              Address.should.be.a.Object();
              Address.should.have.property("street", addr.street);
              PersonAddress.find({ number: 123 }).count(function (err, c) {
                should.equal(err, null);
                c.should.equal(0);
                 done();
              });
            });
          }).catch(function(err) {
            done(err);
          });
        });
      });
    });
  });

  describe("when calling delAccessor + Async", function () {
    before(setup());

    it("should remove any extension", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        PersonAddress.find({ number: 123 }).count(function (err, c) {
          should.equal(err, null);
          c.should.equal(1);

          var addr = new PersonAddress({
            street : "4th Ave",
            number : 4
          });

          John.removeAddressAsync(addr).then(function () {

            PersonAddress.find({ number: 123 }).count(function (err, c) {
              should.equal(err, null);
              c.should.equal(0);

              done();
            });
          }).catch(function(err) {
            done(err);
          });
        });
      });
    });

    it("should return error if instance not with an ID", function (done) {
      var Jane = new Person({
        name: "Jane"
      });
      Jane.removeAddressAsync().catch(function(err) {
        err.should.be.a.Object();
        err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);
        done();
      });
    });
  });

  describe("findBy()", function () { // TODO: make async after Models method include async support
    before(setup());

    it("should throw if no conditions passed", function (done) {
      (function () {
        Person.findByAddress(function () {});
      }).should.throw();

      return done();
    });

    it("should lookup in Model based on associated model properties", function (done) {
      Person.findByAddress({
        number: 123
      }, function (err, people) {
        should.equal(err, null);
        should(Array.isArray(people));
        should(people.length == 1);

        return done();
      });
    });

    it("should return a ChainFind if no callback passed", function (done) {
      var ChainFind = Person.findByAddress({
        number: 123
      });
      ChainFind.run.should.be.a.Function();

      return done();
    });
  });
});
