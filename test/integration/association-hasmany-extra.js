var should = require('should');
var helper = require('../support/spec_helper');

describe("hasMany extra properties", function() {
  var db     = null;
  var Person = null;
  var Pet    = null;

  var setup = function (opts) {
    opts = opts || {};
    return function (done) {
      db.settings.set('instance.identityCache', false);

      Person = db.define('person', {
        name    : String,
      }, opts);
      Pet = db.define('pet', {
        name    : String
      });
      Person.hasMany('pets', Pet, {
        since   : Date,
        data    : Object
      });

      return helper.dropSync([ Person, Pet ], done);
    };
  };

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("if passed to addAccessor", function () {
    before(setup());

    it("should be added to association", function (done) {
      Person.create([{
        name    : "John"
      }], function (err, people) {
        Pet.create([{
          name : "Deco"
        }, {
          name : "Mutt"
        }], function (err, pets) {
          var data = { adopted: true };

          people[0].addPets(pets, { since : new Date(), data: data }, function (err) {
            should.equal(err, null);

            Person.find({ name: "John" }, { autoFetch : true }).first(function (err, John) {
              should.equal(err, null);

              John.should.have.property("pets");
              should(Array.isArray(pets));

              John.pets.length.should.equal(2);

              John.pets[0].should.have.property("name");
              John.pets[0].should.have.property("extra");
              John.pets[0].extra.should.be.a.Object();
              John.pets[0].extra.should.have.property("since");
              should(John.pets[0].extra.since instanceof Date);

              should.equal(typeof John.pets[0].extra.data, 'object');
              should.equal(JSON.stringify(data), JSON.stringify(John.pets[0].extra.data));

              return done();
            });
          });
        });
      });
    });
  });

  describe("if passed to addAccessorAsync", function () {
    before(setup());

    it("should be added to association", function () {
      return Person.createAsync([{
        name    : "John"
      }])
        .then(function (people) {
          return [people, Pet.createAsync([{
            name : "Deco"
          }, {
            name : "Mutt"
          }])];
        })
        .spread(function (people, pets) {
          var data = { adopted: true };

          return [pets, data, people[0].addPetsAsync(pets, { since : new Date(), data: data })];
        })
        .spread(function (pets, data) {
          return [pets, data, Person.find({ name: "John" }, { autoFetch : true }).firstAsync()];
        })
        .spread(function (pets, data, John) {
          John.should.have.property("pets");
          should(Array.isArray(pets));

          John.pets.length.should.equal(2);

          John.pets[0].should.have.property("name");
          John.pets[0].should.have.property("extra");
          John.pets[0].extra.should.be.a.Object();
          John.pets[0].extra.should.have.property("since");
          should(John.pets[0].extra.since instanceof Date);

          should.equal(typeof John.pets[0].extra.data, 'object');
          should.equal(JSON.stringify(data), JSON.stringify(John.pets[0].extra.data));
        });
    });
  });
});
