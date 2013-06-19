var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("db.define()", function() {
	var db = null;

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			return done();
		});
	});

	after(function () {
		return db.close();
	});

	it("should use setting model.namePrefix as table prefix if defined", function (done) {
		db.settings.set("model.namePrefix", "orm_");

		var Person = db.define("person", {
			name: String
		});

		Person.table.should.equal("orm_person");

		return done();
	});
});
