var common = require('../common');
var assert = require('assert');
var async  = require('async');


function round(num, points) {
  var m = Math.pow(10, points);

  return Math.round(num * m) / m;
}

common.createConnection(function (err, db) {
  if (err) throw err;

  var Model = db.define('test-number-size', {
    int2: { type: 'number', size: 2, rational: false },
    int4: { type: 'number', size: 4, rational: false },
    int8: { type: 'number', size: 8, rational: false },
    float4: { type: 'number', size: 4 },
    float8: { type: 'number', size: 8 }
  });

  var data = {
    int2: 32700, int4: 2147483000, int8: 2251799813685248,
    float4: 1 * Math.pow(10, 36),
    float8: 1 * Math.pow(10, 306)
  }

  var protocol = common.protocol().toLowerCase();
  var mysql    = protocol == 'mysql';
  var postgres = protocol == 'postgres';

  async.series([
    function(cb) {
      Model.drop(function (err) {
        if (err) throw err;
        Model.sync(function (err) {
          if (err) throw err;
          cb();
        });
      });
    },
    function(cb) {
      // It should be able to store near MAX sized values for each field
      Model.create(data, function (err, item) {
        if (err) throw err;

        Model.get(item.id, function (err, item) {
          if (err) throw err;

          // Round because different systems store floats in different
          // ways, thereby introducing small errors.
          assert.equal(round(item.int2   / data.int2,   3), 1);
          assert.equal(round(item.int4   / data.int4,   3), 1);
          assert.equal(round(item.int8   / data.int8,   3), 1);
          assert.equal(round(item.float4 / data.float4, 3), 1);
          assert.equal(round(item.float8 / data.float8, 3), 1);
        });

        cb();
      });
    },
    function(cb) {
      // It should not be able to store values which are too large in int2
      Model.create({ int2: data.int4 }, function (err, item) {
        // Postgres throws an error if it detects potential data loss,
        // ie. if it detects an overflow.
        // Mysql truncates the value, and acts like nothing happened.
        if (postgres) {
          assert(err);
          cb();
        } else if (mysql) {
          Model.get(item.id, function (err, item) {
            if (err) throw err;

            assert.notEqual(item.int2, data.int4)
            cb();
          });
        }
      });
    },
    function(cb) {
      // It should not be able to store values which are too large in int4
      Model.create({ int4: data.int8 }, function (err, item) {
        if (postgres) {
          assert(err);
          cb();
        } else if (mysql) {
          Model.get(item.id, function (err, item) {
            if (err) throw err;

            assert.notEqual(item.int4, data.int8)
            cb();
          });
        }
      });
    },
    function(cb) {
      // It should not be able to store values which are too large in float4
      Model.create({ float4: data.float8 }, function (err, item) {
        if (postgres) {
          assert(err);
          cb();
        } else if (mysql) {
          Model.get(item.id, function (err, item) {
            if (err) throw err;

            assert.notEqual(item.float4, data.float8)
            cb();
          });
        }
      });
    }
  ], function () {
    db.close();
  });
});
