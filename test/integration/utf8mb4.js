var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var common   = require('../common');

describe("UTF8mb4", function() {
  var db = null;
  var Text;

  var setup = function () {
    return function (done) {
      Text = db.define("utf8mb4text", {
        value: String
      });

      ORM.singleton.clear();

      return helper.dropSync(Text, function () {
        Text.create({ value: 'Hello 😃' }, done);
      });
    };
  };

  before(function (done) {
    var opts = {};

    if (common.protocol() == 'mysql') {
      opts = { query: { charset: 'utf8mb4' }};
    }

    helper.connect(opts, function (connection) {
      db = connection;

      return done();
    });
  });

  after(function () {
    return db.close();
  });

  describe("strings", function () {
    before(setup());

    it("should be stored", function (done) {
      Text.one(function (err, item) {
        should.equal(err, null);
        should.exist(item);
        should.equal(item.value, 'Hello 😃');

        return done();
      });
    });
  });
});
