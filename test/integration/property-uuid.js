var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');

if (common.protocol() !== "postgres") return;

describe("Property", function() {
  describe("type uuid", function () {
    var db = null;

    before(function (done) {
      helper.connect(function (connection) {
        db = connection;

        done();
      });
    });

    after(function () {
      db.close();
    });

    var Thing = null;

    before(function (done) {
      db.driver.execQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', function (err) {
        should.not.exist(err);

        Thing = db.define('thing', {
          id:   { type: 'uuid', key: true, defaultExpression: 'uuid_generate_v4()' },
          //id:   { type: 'serial' },
          name: { type: 'text' }
        });

        helper.dropSync(Thing, done);
      });
    });

    it("should create the table", function () {
      should(true);
    });

    var infoSQL = "SELECT * FROM information_schema.columns WHERE table_name = 'thing' AND column_name = 'id'";

    it("should have the correct type", function (done) {
      db.driver.execQuery(infoSQL, function (err, cols) {
        should.not.exist(err);

        var uuidCol = cols[0];

        should.exist(uuidCol);
        should.equal(uuidCol.data_type, 'uuid');
        done();
      });
    });

    it("should have the correct default value", function (done) {
      db.driver.execQuery(infoSQL, function (err, cols) {
        should.not.exist(err);

        var uuidCol = cols[0];

        should.exist(uuidCol);
        should.equal(uuidCol.column_default, 'uuid_generate_v4()');
        done();
      });
    });

    it("should set id automatically", function (done) {
      var chair = new Thing({ name: 'chair' });

      chair.save(function (err) {
        should.not.exist(err);

        Thing.find().all(function (err, items) {
          should.not.exist(err);
          should.equal(items.length, 1);
          should.equal(items[0].name, 'chair');
          items[0].id.should.match(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);

          done();
        });
      });
    });

    it("should save", function (done) {
      var horse = new Thing({ name: 'horse' });

      horse.save(function (err) {
        should.not.exist(err);

        Thing.get(horse.id, function (err, item) {
          should.not.exist(err);

          item.name = 'horsey';

          item.save(function (err) {
            should.not.exist(err);

            Thing.get(horse.id, function (err, item) {
              should.not.exist(err);
              should.equal(item.id, horse.id);
              should.equal(item.name, 'horsey');

              done();
            });
          });
        });
      });
    });

  });
});
