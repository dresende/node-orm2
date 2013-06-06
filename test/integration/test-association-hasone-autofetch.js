var async  = require('async');
var common = require('../common');
var assert = require('assert');
var ORM    = require('../../');

common.createConnection(function (err, db) {
  if (!db.driver.sync) return;

  var Person = db.define('test_association_hasone_validate_owner',  common.getModelProperties());
  var Animal = db.define('test_association_hasone_validate_animal', common.getModelProperties());
  Animal.hasOne('owner', Person, { required: false, autoFetch: true });

  async.series([
    // setup
    function(done) {
      common.dropSync([Person, Animal], done);
    },
    // Should save as expected with autoFetch enabled [regression test]
    function(done) {
      var emu = new Animal({name: 'emu'});
      emu.save(function(err) {
        assert(!err);
        done();
      });
    }
  ], function() {
    db.close();
  });
});
