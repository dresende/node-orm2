var _      = require('lodash');
var should = require('should');
var Driver = require('../../../lib/Drivers/DML/mysql').Driver;
var helper = require('../../support/spec_helper');
var common = require('../../common');

if (common.protocol() != "mysql") return;

describe("MySQL driver", function() {
  let db;
  let driver;

  const simpleObj = function (obj) {
    return JSON.parse(JSON.stringify(obj));
  }

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
        should.deepEqual(simpleObj(data), [{ 'count(*)': 1 }]);
        done();
      });
    });

    it("#execSimpleQueryAsync should run query", function () {
      it("should run query", async function () {
        const data = await driver.execSimpleQueryAsync("SELECT count(*)");
        should.deepEqual(simpleObj(data), [{ 'count(*)': 1 }]);
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
        should.deepEqual(simpleObj(data), [{ name: 'jane' }]);
        done();
      });
    });

    it("#findAsync should work", async function () {
      const data = await driver.findAsync(['name'], 'abc', { name: 'jane' }, {});
      should.deepEqual(simpleObj(data), [{ name: 'jane' }]);
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
        should.deepEqual(simpleObj(data), [{ c: 3 }]);
        done();
      });
    });

    it("#countAsync should work", async function () {
      const data = await driver.countAsync('abc', {}, {});
      should.deepEqual(simpleObj(data), [{ c: 3 }]);
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
          should.deepEqual(simpleObj(data), [{ 'count(*)': 1 }]);
          done();
        });
      });
    });

    it("#insertAsync should work", async function () {
      await driver.insertAsync('abc', { name: 'jane' }, null);
      const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc");
      should.deepEqual(simpleObj(data), [{ 'count(*)': 1 }]);
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
          should.deepEqual(simpleObj(data), [{ 'count(*)': 2 }]);
          done();
        });
      });
    });

    it("#updateAsync should work", async function () {
      await driver.updateAsync('abc', { name: 'bob' }, { name: 'jane' });
      const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc WHERE name = 'bob'");
      should.deepEqual(simpleObj(data), [{ 'count(*)': 2 }]);
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
          should.deepEqual(simpleObj(data), [{ name: 'alice' }, { name: 'jane' }]);
          done();
        });
      });
    });

    it("#removeAsync should work", async function () {
      await driver.removeAsync('abc', { name: 'bob' });
      const data = await driver.execSimpleQueryAsync("SELECT name FROM abc ORDER BY name");
      should.deepEqual(simpleObj(data), [{ name: 'alice' }, { name: 'jane' }]);
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
          should.deepEqual(simpleObj(data), [{ 'count(*)': 0 }]);
          done();
        });
      });
    });

    it("#clearAsync should work", async function () {
      await driver.clearAsync('abc');
      const data = await driver.execSimpleQueryAsync("SELECT count(*) FROM abc");
      should.deepEqual(simpleObj(data), [{ 'count(*)': 0 }]);
    });
  });

});
