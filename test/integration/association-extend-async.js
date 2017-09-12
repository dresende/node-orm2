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

  describe("when calling hasAccessorAsync", function () { // TODO: fix Model.find to async
    before(setup());

    it("should return true if found", function () {
      return Person.find()
        .firstAsync()
        .then(function (John) {
          return John.hasAddressAsync();
        })
        .then(function (hasAddress) {
          should.equal(hasAddress, true);
        });
    });

    it("should return error if instance not with an ID", function (done) {
      var Jane = new Person({
        name: "Jane"
      });

      Jane.hasAddressAsync()
        .catch(function (err) {
          err.should.be.a.Object();
          should.equal(Array.isArray(err), false);
          err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);
          done();
        });
    });
  });

  describe("when calling getAccessorAsync", function () { // TODO: fix Model.find to async
    before(setup());

    it("should return extension if found", function () {
      return Person.find()
        .firstAsync()
        .then(function (John) {
          return John.getAddressAsync();
        })
        .then(function (Address) {
          Address.should.be.a.Object();
          should.equal(Array.isArray(Address), false);
          Address.should.have.property("street", "Liberty");
        });
    });

    it("should return error if not found", function (done) {
      Person.find()
        .firstAsync()
        .then(function (John) {
          return [John, John.removeAddressAsync()];
        })
        .spread(function(John) {
          return John.getAddressAsync();
        })
        .catch(function(err) {
          err.should.be.a.Object();
          err.should.have.property("code", ORM.ErrorCodes.NOT_FOUND);
          done();
        });
    });

    it("should return error if instance not with an ID", function (done) {
      var Jane = new Person({
        name: "Jane"
      });
      Jane.getAddressAsync()
        .catch(function(err) {
          err.should.be.a.Object();
          err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);
          done();
        });
    });
  });

  describe("when calling setAccessorAsync", function () {
    before(setup());

    it("should remove any previous extension", function (done) { // TODO: fix Model.find to async
      Person.find().first(function (err, John) {
        should.equal(err, null);

        PersonAddress.find({ number: 123 }).count(function (err, c) {
          should.equal(err, null);
          c.should.equal(1);

          var addr = new PersonAddress({
            street : "4th Ave",
            number : 4
          });

          John.setAddressAsync(addr)
            .then(function () {
              return John.getAddressAsync();
            })
            .then(function (Address) {
              Address.should.be.a.Object();
              should.equal(Array.isArray(Address), false);
              Address.should.have.property("street", addr.street);
              PersonAddress.find({ number: 123 })
                .count(function (err, c) {
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
  });

  describe("when calling delAccessor + Async", function () { // TODO: fix .find to async
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

          John.removeAddressAsync()
            .then(function () {
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
      Jane.removeAddressAsync()
        .catch(function(err) {
          err.should.be.a.Object();
          err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);
          done();
        });
    });
  });
});
