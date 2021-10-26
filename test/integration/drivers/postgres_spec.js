var _      = require('lodash');
var should = require('should');
var Driver = require('../../../lib/Drivers/DML/postgres').Driver;
var helper = require('../../support/spec_helper');
var common = require('../../common');

if (common.protocol() != "postgres") return;

describe("Postgres driver", function() {
  let db;
  let driver;

  before(function (done) {
    helper.connect(function (connection) {
      db     = connection;
      driver = connection.driver;
      done();
    });
  });

  after(function (done) {
    db.close(done);
  });

  describe("execSimpleQuery", function () {
    it("#execSimpleQuery should run query", function (done) {
      driver.execSimpleQuery("SELECT count(*)", function (err, data) {
        should.not.exist(err);
        should.deepEqual(data, [{ count: 1 }]);
        done();
      });
    });

    it("#execSimpleQueryAsync should run query", function () {
      it("should run query", async function () {
        const data = await driver.execSimpleQueryAsync("SELECT count(*)");
        should.deepEqual(data, [{ count: 1 }]);
      });
    });
  });

  describe("ping", function () {
    it("#ping should work", function (done) {
      driver.ping(function (err) {
        should.not.exist(err);
        done();
      });
    });

    it("#pingAsync should work", async function () {
      await driver.pingAsync();
    });
  });

  describe("find", function () {
    beforeEach(async function () {
      await driver.execSimpleQueryAsync("DROP TABLE IF EXISTS abc");
      await driver.execSimpleQueryAsync("CREATE TABLE abc (name varchar(100))");
      await driver.execSimpleQueryAsync("INSERT INTO abc VALUES ('jane'), ('bob'), ('alice')");
    });

    it("#find should work", function (done) {
      driver.find(['name'], 'abc', { name: 'jane' }, {}, function (err, data) {
        should.not.exist(err);
        should.deepEqual(data, [{ name: 'jane' }]);
        done();
      });
    });

    it("#findAsync should work", async function () {
      const data = await driver.findAsync(['name'], 'abc', { name: 'jane' }, {});
      should.deepEqual(data, [{ name: 'jane' }]);
    });
  });

  describe("count", function () {
    beforeEach(async function () {
      await driver.execSimpleQueryAsync("DROP TABLE IF EXISTS abc");
      await driver.execSimpleQueryAsync("CREATE TABLE abc (name varchar(100))");
      await driver.execSimpleQueryAsync("INSERT INTO abc VALUES ('jane'), ('bob'), ('alice')");
    });

    it("#count should work", function (done) {
      driver.count('abc', {}, {}, function (err, data) {
        should.not.exist(err);
        should.deepEqual(data, [{ c: 3 }]);
        done();
      });
    });

    it("#countAsync should work", async function () {
      const data = await driver.countAsync('abc', {}, {});
      should.deepEqual(data, [{ c: 3 }]);
    });
  });

  describe("insert", function () {
    beforeEach(async function () {
      await driver.execSimpleQueryAsync("DROP TABLE IF EXISTS abc");
      await driver.execSimpleQueryAsync("CREATE TABLE abc (name varchar(100))");
    });

    it("#insert should work", function (done) {
      driver.insert('abc', { name: 'jane' }, null, function (err) {
        should.not.exist(err);
        driver.execSimpleQuery("SELECT count(*) FROM abc", function (err, data) {
          should.not.exist(err);
          should.deepEqual(data, [{ count: 1 }]);
          done();
        });
      });
    });

    it("#insertAsync should work", async function () {
      await driver.insertAsync('abc', { name: 'jane' }, null);
      const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc");
      should.deepEqual(data, [{ count: 1 }]);
    });
  });

  describe("update", function () {
    beforeEach(async function () {
      await driver.execSimpleQueryAsync("DROP TABLE IF EXISTS abc");
      await driver.execSimpleQueryAsync("CREATE TABLE abc (name varchar(100))");
      await driver.execSimpleQueryAsync("INSERT INTO abc VALUES ('jane'), ('bob'), ('alice')");
    });

    it("#update should work", function (done) {
      driver.update('abc', { name: 'bob' }, { name: 'jane' }, function (err) {
        should.not.exist(err);
        driver.execSimpleQuery("SELECT count(*) FROM abc WHERE name = 'bob'", function (err, data) {
          should.not.exist(err);
          should.deepEqual(data, [{ count: 2 }]);
          done();
        });
      });
    });

    it("#updateAsync should work", async function () {
      await driver.updateAsync('abc', { name: 'bob' }, { name: 'jane' });
      const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc WHERE name = 'bob'");
      should.deepEqual(data, [{ count: 2 }]);
    });
  });

  describe("remove", function () {
    beforeEach(async function () {
      await driver.execSimpleQueryAsync("DROP TABLE IF EXISTS abc");
      await driver.execSimpleQueryAsync("CREATE TABLE abc (name varchar(100))");
      await driver.execSimpleQueryAsync("INSERT INTO abc VALUES ('jane'), ('bob'), ('alice')");
    });

    it("#remove should work", function (done) {
      driver.remove('abc', { name: 'bob' }, function (err) {
        should.not.exist(err);
        driver.execSimpleQuery("SELECT name FROM abc ORDER BY name", function (err, data) {
          should.not.exist(err);
          should.deepEqual(data, [{ name: 'alice' }, { name: 'jane' }]);
          done();
        });
      });
    });

    it("#removeAsync should work", async function () {
      await driver.removeAsync('abc', { name: 'bob' });
      const data = await driver.execSimpleQueryAsync("SELECT name FROM abc ORDER BY name");
      should.deepEqual(data, [{ name: 'alice' }, { name: 'jane' }]);
    });
  });

  describe("clear", function () {
    beforeEach(async function () {
      await driver.execSimpleQueryAsync("DROP TABLE IF EXISTS abc");
      await driver.execSimpleQueryAsync("CREATE TABLE abc (name varchar(100))");
      await driver.execSimpleQueryAsync("INSERT INTO abc VALUES ('jane'), ('bob'), ('alice')");
    });

    it("#clear should work", function (done) {
      driver.clear('abc', function (err) {
        should.not.exist(err);
        driver.execSimpleQuery("SELECT count(*) FROM abc", function (err, data) {
          should.not.exist(err);
          should.deepEqual(data, [{ count: 0 }]);
          done();
        });
      });
    });

    it("#clearAsync should work", async function () {
      await driver.clearAsync('abc');
      const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc");
      should.deepEqual(data, [{ count: 0 }]);
    });
  });

  describe("#valueToProperty", function () {
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

      describe("dates with non local timezone", function () {
        beforeEach(function () {
          driver = new Driver({ timezone: 'Z' }, {}, {});
        });

        function valueToProperty (value) {
          return driver.valueToProperty(value, { type: 'date' });
        }

        it("should accept null", function () {
          should.strictEqual(valueToProperty(null), null);
        });

        it("should work", function () {
          should.strictEqual(_.isDate(valueToProperty(new Date())), true);
        });

        describe("calculations", function () {
          it("should offset time, relative to timezone", function () {
            d = new Date();

            expected  = d.getTime() - d.getTimezoneOffset() * 60000;
            converted = valueToProperty(d).getTime();

            should.equal(converted, expected);
          });
        });
      });
    });
  });

  describe("#propertyToValue", function () {
    describe("type object", function () {
      function evaluate (input) {
        var driver = new Driver({}, {}, {});
        return driver.propertyToValue(input, { type: 'object' });
      }

      it("should not change null", function () {
        should.strictEqual(evaluate(null), null);
      });

      it("should not change buffer", function () {
        var b = Buffer.alloc(3, 'abc')
        should.strictEqual(evaluate(b), b);
      });

      it("should encode everything else as a Buffer", function () {
        var input = { abc: 123 };
        var out = evaluate(input);

        should(out instanceof Buffer);
        should.equal(JSON.stringify(input), out.toString());
      });
    });

    describe("date", function () {
      function evaluate (input, opts) {
        if (!opts) opts = {};
        var driver = new Driver(opts.config, {}, {});
        return driver.propertyToValue(input, { type: 'date' });
      }

      it("should do nothing when timezone isn't configured", function () {
        var input = new Date();
        var inputStr = input.toString();
        var out = evaluate(input);

        should.strictEqual(input, out);
        should.equal(inputStr, out.toString());
      });

      it("should work with null dates", function () {
        should.strictEqual(evaluate(null, { config: { timezone: 'Z' }}), null);
      });

      it("should work with date objects", function () {
        should.strictEqual(_.isDate(evaluate(new Date(), { config: { timezone: 'Z' }})), true);
      });

      describe("calculations", function () {
        it("should offset time, relative to timezone", function () {
          d = new Date();

          expected = d.getTime() + d.getTimezoneOffset() * 60000;
          converted = evaluate(d, { config: { timezone: 'Z' }}).getTime();

          should.equal(converted, expected);
        });
      });
    });

    describe("type point", function () {
      function evaluate (input) {
        var driver = new Driver({}, {}, {});
        return driver.propertyToValue(input, { type: 'point' });
      }

      it("should encode correctly", function () {
        var out = evaluate({ x: 5, y: 7 });

        should(out instanceof Function);
        should.equal(out(), "POINT(5, 7)");
      });
    });

    describe("custom type", function () {
      var customType = {
        propertyToValue: function (input) {
          return input + ' QWERTY';
        }
      };

      function evaluate (input, customTypes) {
        var driver = new Driver({}, {}, {});
        if (customType) {
          for (var k in customTypes) {
            driver.customTypes[k] = customTypes[k];
          }
        }
        return driver.propertyToValue(input, { type: 'qwerty' });
      }

      it("should do custom type conversion if provided", function () {
        var opts = { qwerty: customType };
        var out = evaluate('f', opts);

        should.equal(out, 'f QWERTY');
      });

      it("should not do custom type conversion if not provided", function () {
        var opts = { qwerty: {} };
        var out = evaluate('f', opts);

        should.equal(out, 'f');
      });
    });

    it("should do nothing for other types", function () {
      function evaluate (input, type) {
        var driver = new Driver({}, {}, {});
        return driver.propertyToValue(input, { type: type });
      }

      should.strictEqual(evaluate('abc', { type: 'string' }), 'abc');
      should.strictEqual(evaluate(42, { type: 'number' }), 42);
      should.strictEqual(evaluate(undefined, { type: 'bleh' }), undefined);
    });

  });

});
