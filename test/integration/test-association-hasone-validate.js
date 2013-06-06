var async  = require('async');
var common = require('../common');
var assert = require('assert');
var ORM    = require('../../');

common.createConnection(function (err, db) {
  if (!db.driver.sync) return;

  var Person = db.define('test_association_hasone_validate_owner',  common.getModelProperties());
  var Animal = db.define('test_association_hasone_validate_animal',
    common.getModelProperties(),
    {
      validations: {
        owner_id: ORM.validators.unique()
      }
    }
  );
  Animal.hasOne('owner', Person, { required: true });

  async.series([
    // setup
    function(done) {
      common.dropSync([Person, Animal], done);
    },
    // Should be able to validate association properties
    function(done) {
      var john = new Person({name: 'John'});

      john.save(function(err) {
        assert(!err);

        var emu = new Animal({name: 'emu', owner_id: john.id});
        emu.save(function(err) {
          // Should not raise any errors inside ORM

          assert(!err);
          done();
        });
      });
    }
  ], function() {
    db.close();
  });
});
