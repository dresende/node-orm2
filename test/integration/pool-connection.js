var async    = require('async');
var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var common   = require('../common');

if (common.protocol() != "postgres" && common.protocol() != "mysql") return;

describe("Pool connection", function () {
	var db = null;

	var setup = function () {
		return function (done) {
			Person = db.define("person", {
				name   : String
			});
			Pet = db.define("pet", {
				name   : { type: "text", defaultValue: "Mutt" }
			});
			Person.hasMany("pets", Pet);

			return helper.dropSync([ Person, Pet ], done);
		};
	};

	before(function (done) {
		helper.connect({query: {pool: true}}, function (connection) {
			db = connection;

			return done();
		});
	});

	after(function () {
		return db.close();
	});

	describe("get connection id", function () {
		it("should return an uuid", function (done) {
			db.driver.createPool(function (err, id) {
				should.not.exist(err);
				id.should.be.a.String();
				db.driver.releasePool(id);
				return done();
			});
		});
	});

	describe("use connection id with create", function () {

		before(setup());

		it("should use the connection", function (done) {
			db.driver.createPool(function (err, id) {
				
				Person.create({name: 'test'}, id, function(err, person) {
					should.not.exist(err);
					person.getConnectionId().should.be.equal(id);

					done();

					describe("use connection id with instance", function () {

						it("should use the connection", function (done) {
							person.useConnectionId(id);

							person.getConnectionId().should.be.equal(id);
							
							db.driver.releasePool(id);
							done();
						});
					});

					db.driver.releasePool(id);
				});
				
			});
		});
	});
});
