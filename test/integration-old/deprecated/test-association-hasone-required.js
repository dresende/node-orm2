var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
  var testRequired = function(required, done) {
    var Person = db.define('test_association_hasone_required_owner',  common.getModelProperties());
    var Animal = db.define('test_association_hasone_required_animal', common.getModelProperties());
    Animal.hasOne('owner', Person, { required: required });

    if (!db.driver.sync) return;

    var test = function(cb) {
      Person.sync(function (err) {
        assert(!err);
        Animal.sync(function (err) {
          assert(!err);

          var john = new Person({name: 'John'});
          john.save(function(err) {
            assert(!err);

            var emu = new Animal({name: 'emu', owner_id: null});
            emu.save(function(err) {
              // When required is true, there should be an error.
              // When required is false, there should be no errors.
              assert.equal(!!err, required);

              cb();
            });
          });
        });
      });
    };

    Person.drop(function (err) {
      Animal.drop(function (err) {
        test(function() {
          done();
        });
      });
    });
  };

  testRequired(false, function() {
    testRequired(true, function() {
      db.close();
    });
  });
});
