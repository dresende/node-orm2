var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("ORM", function() {
	var db = null;
	var Person = null;

	var setup = function (cache) {
		return function (done) {
			Person = db.define("person", {
				name   : String
			}, {
				cache  : cache,
				methods: {
					UID: function () {
						return this.id;
					}
				}
			});

			ORM.singleton.clear(); // clear cache

			return helper.dropSync(Person, function () {
				Person.create([{
					name: "John Doe"
				}, {
					name: "Jane Doe"
				}], done);
			});
		};
	};

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			return done();
		});
	});

	after(function () {
		return db.close();
	});

	describe("when loaded", function () {
		before(setup(true));

		it("should expose .express(), .use() and .connect()", function (done) {
			ORM.express.should.a("function");
			ORM.use.should.a("function");
			ORM.connect.should.a("function");

			return done();
		});

		it("should expose default settings container", function (done) {
			ORM.settings.should.a("object");
			ORM.settings.get.should.a("function");
			ORM.settings.set.should.a("function");
			ORM.settings.unset.should.a("function");

			return done();
		});

		it("should expose generic Settings constructor", function (done) {
			ORM.Settings.should.a("object");
			ORM.Settings.Container.should.a("function");

			return done();
		});

		it("should expose singleton manager", function (done) {
			ORM.singleton.should.a("object");
			ORM.singleton.clear.should.a("function");

			return done();
		});

		it("should expose predefined validators", function (done) {
			ORM.validators.should.a("object");
			ORM.validators.rangeNumber.should.a("function");
			ORM.validators.rangeLength.should.a("function");

			return done();
		});
	});
});

describe("ORM.connect()", function () {
	it("should expose .use(), .define(), .sync() and .load()", function (done) {
		var db = ORM.connect();

		db.use.should.a("function");
		db.define.should.a("function");
		db.sync.should.a("function");
		db.load.should.a("function");

		return done();
	});

	it("should emit an error if no url is passed", function (done) {
		var db = ORM.connect();

		db.on("connect", function (err) {
			err.message.should.equal("CONNECTION_URL_EMPTY");

			return done();
		});
	});

	it("should emit an error if empty url is passed", function (done) {
		var db = ORM.connect("");

		db.on("connect", function (err) {
			err.message.should.equal("CONNECTION_URL_EMPTY");

			return done();
		});
	});

	it("should emit an error if empty url (with only spaces) is passed", function (done) {
		var db = ORM.connect("   ");

		db.on("connect", function (err) {
			err.message.should.equal("CONNECTION_URL_EMPTY");

			return done();
		});
	});

	it("should emit an error if no protocol is passed", function (done) {
		var db = ORM.connect("user@db");

		db.on("connect", function (err) {
			err.message.should.equal("CONNECTION_URL_NO_PROTOCOL");

			return done();
		});
	});

	it("should emit an error if unknown protocol is passed", function (done) {
		var db = ORM.connect("unknown://db");

		db.on("connect", function (err) {
			err.message.should.equal("CONNECTION_PROTOCOL_NOT_SUPPORTED");

			return done();
		});
	});

	describe("if callback is passed", function (done) {
		it("should return an error if empty url is passed", function (done) {
			ORM.connect("", function (err) {
				err.message.should.equal("CONNECTION_URL_EMPTY");

				return done();
			});
		});

		it("should return an error if no protocol is passed", function (done) {
			ORM.connect("user@db", function (err) {
				err.message.should.equal("CONNECTION_URL_NO_PROTOCOL");

				return done();
			});
		});

		it("should return an error if unknown protocol is passed", function (done) {
			ORM.connect("unknown://db", function (err) {
				err.message.should.equal("CONNECTION_PROTOCOL_NOT_SUPPORTED");

				return done();
			});
		});
	});
});
