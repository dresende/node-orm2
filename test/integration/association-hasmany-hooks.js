var should = require('should');
var helper = require('../support/spec_helper');

describe("hasMany hooks", function() {
  var db     = null;
  var Person = null;
  var Pet    = null;

  var setup = function (props, opts) {
    return function (done) {
      db.settings.set('instance.identityCache', false);

      Person = db.define('person', {
        name    : String,
      });
      Pet = db.define('pet', {
        name    : String
      });
      Person.hasMany('pets', Pet, props || {}, opts || {});

      return helper.dropSync([ Person, Pet ], done);
    };
  };

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("beforeSave", function () {
    var had_extra = false;

    before(setup({
      born : Date
    }, {
      hooks : {
        beforeSave: function (extra, next) {
          had_extra = (typeof extra == "object");
          return next();
        }
      }
    }));

    it("should pass extra data to hook if extra defined", function (done) {
      Person.create({
        name    : "John"
      }, function (err, John) {
        Pet.create({
          name : "Deco"
        }, function (err, Deco) {
          John.addPets(Deco, function (err) {
            should.not.exist(err);

            had_extra.should.be.true;

            return done();
          });
        });
      });
    });
  });

  describe("beforeSave", function () {
    before(setup({}, {
      hooks : {
        beforeSave: function (next) {
          next.should.be.a.Function();
          return next();
        }
      }
    }));

    it("should not pass extra data to hook if extra defined", function (done) {
      Person.create({
        name    : "John"
      }, function (err, John) {
        Pet.create({
          name : "Deco"
        }, function (err, Deco) {
          John.addPets(Deco, function (err) {
            should.not.exist(err);

            return done();
          });
        });
      });
    });
  });

  describe("beforeSave", function () {
    before(setup({}, {
      hooks : {
        beforeSave: function (next) {
          setTimeout(function () {
            return next(new Error('blocked'));
          }, 100);
        }
      }
    }));

    it("should block if error returned", function (done) {
      Person.create({
        name    : "John"
      }, function (err, John) {
        Pet.create({
          name : "Deco"
        }, function (err, Deco) {
          John.addPets(Deco, function (err) {
            should.exist(err);
            err.message.should.equal('blocked');

            return done();
          });
        });
      });
    });
  });

  describe("beforeSaveAsync", function () {
    var had_extra = false;

    before(setup({
      born : Date
    }, {
      hooks : {
        beforeSave: function (extra) {
          return new Promise(function (resolve) {
            setTimeout(function () {
              had_extra = (typeof extra == "object");
              resolve()
            }, 1000);
          });
        }
      }
    }));

    it("should pass extra data to hook if extra defined", function () {
      return Person.createAsync({
        name    : "John"
      })
        .then(function (John) {
          return [John, Pet.createAsync({
            name : "Deco"
          })];
        })
        .spread(function (John, Deco) {
          return John.addPetsAsync(Deco);
        })
        .then(function () {
          had_extra.should.equal(true);
        });
    });
  });

  describe("beforeSaveAsync", function () {
    before(setup({}, {
      hooks : {
        beforeSave: function () {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              return reject(new Error('blocked'));
            }, 1000);
          });
        }
      }
    }));

    it("should block if error returned", function () {
      return Person.createAsync({
        name    : "John"
      })
        .then(function (John) {
          return [John, Pet.createAsync({
            name : "Deco"
          })];
        })
        .spread(function (John, Deco) {
          return John.addPetsAsync(Deco);
        })
        .catch(function(err) {
          should.exist(err);
          err.message.should.equal('blocked');
        });
    });
  });
});
