var ORM    = require('../../');
var helper = require('../support/spec_helper');
var should = require('should');
var async  = require('async');
var _      = require('lodash');

describe("hasOne", function() {
	var db     = null;
	var Person = null;

	var setup = function (required) {
		return function (done) {
			db.settings.set('instance.cache', false);

			Person = db.define('person', {
				name     : String
			});
			Person.hasOne('parent', Person, {
				required : required
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
				name      : "John",
				parent_id : null
			});
			John.save(function (err) {
				should.exist(err);
				return done();
			});
		});

		it("should accept association", function (done) {
			var John = new Person({
				name      : "John",
				parent_id : 1
			});
			John.save(function (err) {
				should.not.exist(err);
				return done();
			});
		});
	});

	describe("not required", function () {
		before(setup(false));

		it("should accept empty association", function (done) {
			var John = new Person({
				name : "John"
			});
			John.save(function (err) {
				should.not.exist(err);
				return done();
			});
		});

		it("should accept null association", function (done) {
			var John = new Person({
				name      : "John",
				parent_id : null
			});
			John.save(function (err) {
				should.not.exist(err);
				return done();
			});
		});
	});
});
