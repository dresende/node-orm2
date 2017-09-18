var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("LazyLoad Async properties", function() {
  var db = null;
  var Person = null;
  var PersonPhoto = new Buffer(1024); // fake photo
  var OtherPersonPhoto = new Buffer(1024); // other fake photo

  var setup = function () {
    return function (done) {
      Person = db.define("person", {
        name   : String,
        photo  : { type: "binary", lazyload: true }
      });

      ORM.singleton.clear();

      return helper.dropSync(Person, function () {
        Person.create({
          name  : "John Doe",
          photo : PersonPhoto
        }, done);
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

  describe("when defined Async methods", function () {
    before(setup());

    it("should not be available when fetching an instance", function () {
      return Person
        .findAsync()
        .then(function (John) {
          var john = John[0];
          
          should.equal(typeof john, 'object');
          should.equal(Array.isArray(john), false);
          john.should.have.property("name", "John Doe");
          john.should.have.property("photo", null);
        });
    });

    it("should have apropriate accessors", function () {
      return Person
        .findAsync()
        .then(function (persons) {
          var John = persons[0];
          should.equal(typeof John, 'object');
          should.equal(Array.isArray(John), false);
          
          John.getPhotoAsync.should.be.a.Function();
          John.setPhotoAsync.should.be.a.Function();
          John.removePhotoAsync.should.be.a.Function();
        });
    });

    it("getAccessorAsync should return property", function () {
      return Person
        .findAsync()
        .then(function (persons) {
          var John = persons[0];
  
          should.equal(typeof John, 'object');
          should.equal(Array.isArray(John), false);
          return John.getPhotoAsync();
        })
        .then(function (photo) {
          photo.toString().should.equal(PersonPhoto.toString());
        });
    });

    it("setAccessorAsync should change property", function () {
      return Person
        .findAsync()
        .then(function (persons) {
          var John = persons[0];
          should.equal(typeof John, 'object');
          return John.setPhotoAsync(OtherPersonPhoto);
        })
        .then(function (johnPhotoUpdated) {
          should.equal(typeof johnPhotoUpdated, 'object');
          return Person.findAsync();
        })
        .then(function (persons) {
          var John = persons[0];
          
          should.equal(typeof John, 'object');
          should.equal(Array.isArray(John), false);
          return John.getPhotoAsync();
        })
        .then(function (photo) {
          photo.toString().should.equal(OtherPersonPhoto.toString());
        });
    });

    it("removeAccessorAsync should change property", function () {
      return Person
        .findAsync()
        .then(function (persons) {
          var John = persons[0];
          
          should.equal(typeof John, 'object');
          should.equal(Array.isArray(John), false);
          return John.removePhotoAsync();
        })
        .then(function (John) {
          return Person.getAsync(John[Person.id]);
        })
        .then(function (John) {
          should.equal(typeof John, 'object');
          should.equal(Array.isArray(John), false);
          return John.getPhotoAsync();
        })
        .then(function (photo) {
          should.equal(photo, null);
        });
    });
  });
});
