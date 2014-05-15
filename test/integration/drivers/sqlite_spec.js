var _      = require('lodash');
var should = require('should');
var Driver = require('../../../lib/Drivers/DML/sqlite').Driver;
var helper = require('../../support/spec_helper');
var common = require('../../common');

if (common.protocol() != "sqlite") return;

describe("Sqlite driver", function() {
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
