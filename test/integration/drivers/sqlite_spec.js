var _      = require('lodash');
var should = require('should');
var Driver = require('../../../lib/Drivers/DML/sqlite').Driver;
var helper = require('../../support/spec_helper');
var common = require('../../common');

if (common.protocol() != "sqlite") return;

describe("Sqlite driver", function() {
  describe("#valueToProperty", function () {
    var driver = null;

    before(function () {
      driver = new Driver({}, {}, {});
    });

    describe("numbers", function () {
      describe("floats", function () {
        function valueToProperty (value) {
          return driver.valueToProperty(value, { type: 'number' });
        }

        it("should pass on empty string", function () {
          should.strictEqual(valueToProperty(''), '');
        });

        it("should pass on text", function () {
          should.strictEqual(valueToProperty('fff'), 'fff');
        });

        it("should pass on numbers", function () {
          should.strictEqual(valueToProperty(1.2), 1.2);
        });

        it("should parse numbers in strings", function () {
          should.strictEqual(valueToProperty('1.2'), 1.2);
          should.strictEqual(valueToProperty('1.200 '), 1.2);
        });

        it("should support non finite numbers", function () {
          should.strictEqual(valueToProperty( 'Infinity'),  Infinity);
          should.strictEqual(valueToProperty('-Infinity'), -Infinity);
          should.strictEqual(isNaN(valueToProperty('NaN')), true);
        });
      });

      describe("integers", function () {
        function valueToProperty (value) {
          return driver.valueToProperty(value, { type: 'integer' });
        }

        it("should pass on empty string", function () {
          should.strictEqual(valueToProperty(''), '');
        });

        it("should pass on text", function () {
          should.strictEqual(valueToProperty('fff'), 'fff');
        });

        it("should pass on non finite numbers as text", function () {
          should.strictEqual(valueToProperty( 'Infinity'),  'Infinity');
          should.strictEqual(valueToProperty('-Infinity'), '-Infinity');
          should.strictEqual(valueToProperty('NaN'), 'NaN');
        });

        it("should pass on numbers", function () {
          should.strictEqual(valueToProperty(1.2), 1.2);
        });

        it("should parse integers in strings", function () {
          should.strictEqual(valueToProperty('1.2'), 1);
          should.strictEqual(valueToProperty('1.200 '), 1);
        });
      });

      describe("date", function () {
        var timezone = /GMT([+/-]\d{4})/.exec(new Date().toString())[1];

        function valueToProperty (value) {
          return driver.valueToProperty(value, { type: 'date' });
        }

        it("should return origin object when given non-string", function () {
          var now = new Date();
          should.strictEqual(valueToProperty(now), now);
          var array = [];
          should.strictEqual(valueToProperty(array), array);
          var obj = {};
          should.strictEqual(valueToProperty(obj), obj);
        })

        it("should pass on normal time", function () {
          var normal = '2017-12-07 00:00:00';
          should.strictEqual(valueToProperty(normal).toString(), new Date(normal).toString());
        })

        it("should pass on utc time by orm saved with local config", function () {
          var utc = '2017-12-07T00:00:00';
          should.strictEqual(valueToProperty(utc+'Z').toString(), new Date(utc+timezone).toString());
        })

        it("should pass on utc time by orm saved with timezone config", function () {
          var utc = '2017-12-07T00:00:00';
          driver.config.timezone = timezone;
          should.strictEqual(valueToProperty(utc+'Z').toString(), new Date(utc+timezone).toString());
          driver.config.timezone = '';
        })
      });
    });
  });

  describe("db", function () {
    var db = null;
    var Person = null;

    before(function (done) {
      helper.connect(function (connection) {
        db = connection;

        Person = db.define("person", {
          name: String
        });

        return helper.dropSync([ Person ], done);
      });
    });

    after(function () {
      return db.close();
    });

    describe("#clear", function () {
      beforeEach(function (done) {
        Person.create([{ name: 'John' }, { name: 'Jane' }], function (err) {
          Person.count(function (err, count) {
            should.not.exist(err);
            should.equal(count, 2);
            done();
          });
        });
      });

      it("should drop all items", function (done) {
        Person.clear(function (err) {
          should.not.exist(err);

          Person.count(function (err, count) {
            should.not.exist(err);
            should.equal(count, 0);
            done();
          });
        });
      });

      it("should reset id sequence", function (done) {
        Person.clear(function (err) {
          should.not.exist(err);
          db.driver.execQuery("SELECT * FROM ?? WHERE ?? = ?", ['sqlite_sequence', 'name', Person.table], function (err, data) {
            should.not.exist(err);

            Person.create({ name: 'Bob' }, function (err, person) {
              should.not.exist(err);
              should.equal(person.id, 1);

              done();
            });
          });
        });
      });
    });
  });
});
