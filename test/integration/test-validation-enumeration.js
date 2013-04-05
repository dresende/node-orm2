var common     = require('../common');
var assert     = require('assert');

common.createConnection(function (err, db) {
  common.createModel2Table('test_validation_enum', db.driver.db, function () {
    var TestModel = db.define('test_validation_enum', common.getModel2Properties(), {
      validations: {
        name: [
          common.ORM.validators.rangeLength(3, 30),
          common.ORM.validators.notEmptyString()
        ],
        assoc_id: common.ORM.validators.rangeNumber(1,50)
      }
    });

    var Test = new TestModel({ name: "a", assoc_id: 51 });
    Test.save(function (err) {
      assert.equal(typeof err, "object");
      assert.equal(err.type, "validation");

      Test.getValidationErrors(function (err, errors) {
        assert.equal(err, null)
        assert.deepEqual(errors, {
          name: ['out-of-range-length'],
          assoc_id: ['out-of-range-number']
        });

        db.close();
      });
    });
  });
});
