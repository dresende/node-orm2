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
		var MyPlugin = require("../support/my_plugin");
		var opts     = {
			option       : true,
			calledDefine : false
		};

		db.use(MyPlugin, opts);

		var MyModel = db.define("my_model", { // db.define should call plugin.define method
			property: String
		});

		opts.calledDefine.should.be.true;

		return done();
	});

	it("a plugin should be able to catch models before defining them", function (done) {
		var MyPlugin = require("../support/my_plugin");
		var opts     = {
			option       : true,
			calledDefine : false,
			beforeDefine : function (name, props, opts) {
				props.otherprop = Number;
			}
		};

		db.use(MyPlugin, opts);

		var MyModel = db.define("my_model", { // db.define should call plugin.define method
			property: String
		});

		opts.calledDefine.should.be.true;
		MyModel.properties.should.have.property("otherprop");

		return done();
	});

	it("should be able to register a plugin as string", function (done) {
		var opts     = {
			option       : true,
			calledDefine : false
		};

		db.use("../support/my_plugin", opts);

		var MyModel = db.define("my_model", { // db.define should call plugin.define method
			property: String
		});

		opts.calledDefine.should.be.true;

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

describe("db.serial()", function () {
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

	it("should be able to execute chains in serial", function (done) {
		var Person = db.define("person", {
			name    : String,
			surname : String
		});
		helper.dropSync(Person, function () {
			Person.create([
				{ name : "John", surname : "Doe" },
				{ name : "Jane", surname : "Doe" }
			], function () {
				db.serial(
					Person.find({ surname : "Doe" }),
					Person.find({ name    : "John" })
				).get(function (err, DoeFamily, JohnDoe) {
					should.equal(err, null);

					should(Array.isArray(DoeFamily));
					should(Array.isArray(JohnDoe));

					DoeFamily.length.should.equal(2);
					JohnDoe.length.should.equal(1);

					DoeFamily[0].surname.should.equal("Doe");
					DoeFamily[1].surname.should.equal("Doe");

					JohnDoe[0].name.should.equal("John");

					return done();
				});
			});
		});
	});
});
