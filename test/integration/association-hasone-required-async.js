var ORM    = require('../../');
var helper = require('../support/spec_helper');
var should = require('should');
var async  = require('async');
var _      = require('lodash');

describe("hasOne Async", function() {
  var db     = null;
  var Person = null;

  var setup = function (required) {
    return function (done) {
      db.settings.set('instance.identityCache', false);
      db.settings.set('instance.returnAllErrors', true);

      Person = db.define('person', {
        name     : String
      });
      Person.hasOne('parent', Person, {
        required : required,
        field    : 'parentId'
      });

      return helper.dropSync(Person, done);
    };
  };

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("required", function () {
    before(setup(true));

    it("should not accept empty association", function (done) {
      var John = new Person({
        name     : "John",
        parentId : null
      });
      John.saveAsync()
        .catch(function(err) {
          should.exist(err);
          should.equal(err.length, 1);
          should.equal(err[0].type,     'validation');
          should.equal(err[0].msg,      'required');
          should.equal(err[0].property, 'parentId');
          done();
        });
    });

    it("should accept association", function () {
      var John = new Person({
        name     : "John",
        parentId : 1
      });
      return John.saveAsync();
    });
  });

  describe("not required", function () {
    before(setup(false));

    it("should accept empty association", function () {
      var John = new Person({
        name : "John"
      });
      return John.saveAsync();
    });

    it("should accept null association", function () {
      var John = new Person({
        name      : "John",
        parent_id : null
      });
      return John.saveAsync();
    });
  });
});