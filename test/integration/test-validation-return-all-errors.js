var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
  db.settings.set('instance.returnAllErrors', true);
  common.createModelTable('test_validation_all_errors', db.driver.db, function () {
    var TestModel = db.define('test_validation_all_errors', common.getModelProperties(), {
      validations: {
        name: [
          function (name, next) {
            return next('force-fail');
          },
          function (name, next) {
            return next('force-fail-2');
          }
        ]
      }
    });

    var Test = new TestModel({ name: "test-validation" });
    Test.save(function (err) {
      assert(Array.isArray(err));
      assert.deepEqual( err.map(function(e) { return e.msg; } ), ['force-fail','force-fail-2'] );

      Test = new TestModel({ name: "test-validation" });
      Test.validate(function (err) {
        assert(Array.isArray(err));
        assert.deepEqual( err.map(function(e) { return e.msg; } ), ['force-fail','force-fail-2'] );

        db.close();
      });
    });
  });
});
