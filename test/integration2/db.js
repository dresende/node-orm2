var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("db.use()", function () {
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

	it("should be able to register a plugin", function (done) {
		var MyPlugin = function MyPlugin(DB, opts) {
			db.should.equal(DB);
			opts.should.eql({ option: true });

			return {
				define: function (Model) {
					Model.should.be.a("function");
					Model.id.should.be.a("string");
					calledDefine = true;
				}
			};
		};

		db.use(MyPlugin, { option: true });

		var calledDefine = false;
		var MyModel = db.define("my_model", { // db.define should call plugin.define method
			property: String
		});

		calledDefine.should.be.true;

		return done();
	});
});

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

describe("db.load()", function () {
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

	it("should require a file based on relative path", function (done) {
		db.load("../support/spec_load", function () {
			db.models.should.have.property("person");
			db.models.should.have.property("pet");

			return done();
		});
	});
});
