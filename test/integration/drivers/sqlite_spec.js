var _      = require('lodash');
var should = require('should');
var Driver = require('../../../lib/Drivers/DML/sqlite').Driver;
var helper = require('../../support/spec_helper');
var common = require('../../common');

if (common.protocol() != "sqlite") return;

describe("Sqlite driver", function() {
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
        should.deepEqual(data, [{ 'count(*)': 1 }]);
        done();
      });
    });

    it("#execSimpleQueryAsync should run query", function () {
      it("should run query", async function () {
        const data = await driver.execSimpleQueryAsync("SELECT count(*)");
        should.deepEqual(data, [{ 'count(*)': 1 }]);
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
          should.deepEqual(data, [{ 'count(*)': 1 }]);
          done();
        });
      });
    });

    it("#insertAsync should work", async function () {
      await driver.insertAsync('abc', { name: 'jane' }, null);
      const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc");
      should.deepEqual(data, [{ 'count(*)': 1 }]);
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
          should.deepEqual(data, [{ 'count(*)': 2 }]);
          done();
        });
      });
    });

    it("#updateAsync should work", async function () {
      await driver.updateAsync('abc', { name: 'bob' }, { name: 'jane' });
      const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc WHERE name = 'bob'");
      should.deepEqual(data, [{ 'count(*)': 2 }]);
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
    describe("without sqlite_sequence table", function () {
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
            should.deepEqual(data, [{ 'count(*)': 0 }]);
            done();
          });
        });
      });

      it("#clearAsync should work", async function () {
        await driver.clearAsync('abc');
        const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc");
        should.deepEqual(data, [{ 'count(*)': 0 }]);
      });
    });

    describe("with sqlite_sequence table", function () {
      beforeEach(async function () {
        await driver.execSimpleQueryAsync("DROP TABLE IF EXISTS abc");
        await driver.execSimpleQueryAsync("CREATE TABLE abc (name varchar(100), id INTEGER PRIMARY KEY AUTOINCREMENT)");
        await driver.execSimpleQueryAsync("INSERT INTO abc VALUES ('jane', null), ('bob', null), ('alice', null)");
      });

      it("#clear should work", function (done) {
        driver.clear('abc', function (err) {
          should.not.exist(err);
          driver.execSimpleQuery("SELECT count(*) FROM abc", function (err, data) {
            should.not.exist(err);
            should.deepEqual(data, [{ 'count(*)': 0 }]);
            done();
          });
        });
      });

      it("#clearAsync should work", async function () {
        await driver.clearAsync('abc');
        const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc");
        should.deepEqual(data, [{ 'count(*)': 0 }]);
      });
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
