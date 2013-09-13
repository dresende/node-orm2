var should = require('should');
var helper = require('../support/spec_helper');
var ORM    = require('../../');
var common = require('../common');

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

	it("should be able to load more than one file", function (done) {
		db.load("../support/spec_load_second", "../support/spec_load_third", function () {
			db.models.should.have.property("person");
			db.models.should.have.property("pet");

			return done();
		});
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

	it("should be able to load more than one file passed as Array", function (done) {
		db.load([ "../support/spec_load_second", "../support/spec_load_third" ], function () {
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

describe("db.driver", function () {
	var db = null;

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			var Log = db.define('log', {
				what : { type: 'text' },
				when : { type: 'date', time: true },
				who  : { type: 'text' }
			});

			helper.dropSync(Log, function (err) {
				if (err) return done(err);

				Log.create([
					{ what: "password reset", when: new Date('2013/04/07 12:33:05'), who: "jane" },
					{ what: "user login",     when: new Date('2013/04/07 13:01:44'), who: "jane" },
					{ what: "user logout",    when: new Date('2013/05/12 04:09:31'), who: "john" }
				], done);
			});
		});
	});

	after(function () {
		return db.close();
	});

	it("should be available", function () {
		should.exist(db.driver);
	});

	if (common.protocol() == "mongodb") return;

	describe("query", function () {
		it("should be available", function () {
			should.exist(db.driver.query);
		});

		describe("#execQuery", function () {
			it("should execute sql queries", function (done) {
				db.driver.execQuery("SELECT id FROM log", function (err, data) {
					should.not.exist(err);

					should(JSON.stringify(data) == JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]));
					done();
				});
			});

			it("should escape sql queries", function (done) {
				var query = "SELECT log.?? FROM log WHERE log.?? LIKE ? AND log.?? > ?";
				var args  = ['what', 'who', 'jane', 'when', new Date('2013/04/07 12:40:00')];
				db.driver.execQuery(query, args, function (err, data) {
					should.not.exist(err);

					should(JSON.stringify(data) == JSON.stringify([{ "what": "user login" }]));
					done();
				});
			});
		});
	});
});
