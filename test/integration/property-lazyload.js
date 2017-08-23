var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("LazyLoad properties", function() {
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

  describe("when defined", function () {
    before(setup());

    it("should not be available when fetching an instance", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.should.be.a.Object();

        John.should.have.property("name", "John Doe");
        John.should.have.property("photo", null);

        return done();
      });
    });

    it("should have apropriate accessors", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.should.be.a.Object();

        John.getPhoto.should.be.a.Function();
        John.setPhoto.should.be.a.Function();
        John.removePhoto.should.be.a.Function();
        John.getPhotoAsync.should.be.a.Function();
        John.setPhotoAsync.should.be.a.Function();
        John.removePhotoAsync.should.be.a.Function();

        return done();
      });
    });

    it("getAccessor should return property", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);

        John.should.be.a.Object();

        John.getPhoto(function (err, photo) {
          should.equal(err, null);
          photo.toString().should.equal(PersonPhoto.toString());

          return done();
        });
      });
    });

    it("promise-based getAccessor should return property", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);
        John.should.be.a.Object();
        John.getPhotoAsync()
          .then(function (photo) {
            photo.toString().should.equal(PersonPhoto.toString());
            done();
          }).catch(function(err) {
            if (err) done(err);
          });
      });
    });

    it("setAccessor should change property", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);
        John.should.be.a.Object();

        John.setPhoto(OtherPersonPhoto, function (err) {
          should.equal(err, null);

          Person.find().first(function (err, John) {
            should.equal(err, null);
            John.should.be.a.Object();

            John.getPhoto(function (err, photo) {
              should.equal(err, null);
              photo.toString().should.equal(OtherPersonPhoto.toString());
              return done();
            });
          });
        });
      });
    });

    it("promise-based setAccessor should change property", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);
        John.should.be.a.Object();

        John.setPhotoAsync(OtherPersonPhoto)
          .then(function (johnPhotoUpdated) {
            johnPhotoUpdated.should.be.a.Object();

            Person.find().first(function (err, John) {
              should.equal(err, null);
              John.should.be.a.Object();

              John.getPhotoAsync()
                .then(function (photo) {
                  should.equal(err, null);
                  photo.toString().should.equal(OtherPersonPhoto.toString());
                  done();
                }).catch(function (err) {
                  if (err) done(err);
                });
            });
          });
      });
    });

    it("removeAccessor should change property", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);
          John.should.be.a.Object();

          John.removePhoto(function (err) {
            should.equal(err, null);

            Person.get(John[Person.id], function (err, John) {
              should.equal(err, null);
              John.should.be.a.Object();

              John.getPhoto(function (err, photo) {
                should.equal(err, null);
                should.equal(photo, null);

                return done();
              });
            });
          });
        });
    });

    it("promise-based removeAccessor should change property", function (done) {
      Person.find().first(function (err, John) {
        should.equal(err, null);
        John.should.be.a.Object();

        John.removePhotoAsync().then(function () {
          should.equal(err, null);
          Person.get(John[Person.id], function (err, John) {
            should.equal(err, null);
            John.should.be.a.Object();

            John.getPhotoAsync()
              .then(function (photo) {
                should.equal(err, null);
                should.equal(photo, null);
                done();
              }).catch(function (err) {
                if (err) done(err);
              });
          });
        });
      });
    });
  });
});
