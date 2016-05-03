var _        = require('lodash');
var sqlite   = require('sqlite3');
var pg       = require('pg');
var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var common   = require('../common');
var protocol = common.protocol();

describe("ORM", function() {
	describe("when loaded", function () {
		it("should expose .express(), .use() and .connect()", function (done) {
			ORM.express.should.be.a.Function();
			ORM.use.should.be.a.Function();
			ORM.connect.should.be.a.Function();

			return done();
		});

		it("should expose default settings container", function (done) {
			ORM.settings.should.be.a.Object();
			ORM.settings.get.should.be.a.Function();
			ORM.settings.set.should.be.a.Function();
			ORM.settings.unset.should.be.a.Function();

			return done();
		});

		it("should expose generic Settings constructor", function (done) {
			ORM.Settings.should.be.a.Object();
			ORM.Settings.Container.should.be.a.Function();

			return done();
		});

		it("should expose singleton manager", function (done) {
			ORM.singleton.should.be.a.Object();
			ORM.singleton.clear.should.be.a.Function();

			return done();
		});

		it("should expose predefined validators", function (done) {
			ORM.validators.should.be.a.Object();
			ORM.validators.rangeNumber.should.be.a.Function();
			ORM.validators.rangeLength.should.be.a.Function();

			return done();
		});
	});
});

describe("ORM.connect()", function () {
	it("should expose .use(), .define(), .sync() and .load()", function (done) {
		var db = ORM.connect();

		db.use.should.be.a.Function();
		db.define.should.be.a.Function();
		db.sync.should.be.a.Function();
		db.load.should.be.a.Function();

		return done();
	});

	it("should emit an error if no url is passed", function (done) {
		var db = ORM.connect();

		db.on("connect", function (err) {
			err.message.should.equal("CONNECTION_URL_EMPTY");

			return done();
		});
	});

	it("should allow protocol alias", function (done) {
		var db = ORM.connect("pg://127.0.0.2");

		db.once("connect", function (err) {
			should.exist(err);
			err.message.should.not.equal("CONNECTION_PROTOCOL_NOT_SUPPORTED");

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
			should.equal(err.literalCode, 'NO_SUPPORT');
			should.equal(
				err.message,
				"Connection protocol not supported - have you installed the database driver for unknown?"
			);

			return done();
		});
	});

	it("should emit an error if cannot connect", function (done) {
		var db = ORM.connect("mysql://fakeuser:nopassword@127.0.0.1/unknowndb");

		db.on("connect", function (err) {
			should.exist(err);
			should.equal(err.message.indexOf("Connection protocol not supported"), -1);
			err.message.should.not.equal("CONNECTION_URL_NO_PROTOCOL");
			err.message.should.not.equal("CONNECTION_URL_EMPTY");

			return done();
		});
	});

	it("should emit valid error if exception being thrown during connection try", function (done) {
		var testConfig = {
			protocol : 'mongodb',
			href     : 'unknownhost',
			database : 'unknowndb',
			user     : '',
			password : ''
		},
		db = ORM.connect(testConfig);

		db.on("connect", function (err) {
			should.exist(err);
			should.equal(err.message.indexOf("Connection protocol not supported"), -1);
			err.message.should.not.equal("CONNECTION_URL_NO_PROTOCOL");
			err.message.should.not.equal("CONNECTION_URL_EMPTY");

			return done();
		});
	});

	it("should not modify connection opts", function (done) {
		var opts = {
			protocol : 'mysql',
			user     : 'notauser',
			password : "wrong password",
			query    : { pool: true, debug: true }
		};

		var expected = JSON.stringify(opts);

		ORM.connect(opts, function (err, db) {
			should.equal(
				JSON.stringify(opts),
				expected
			);
			done();
		});
	});

	it("should emit no error if ok", function (done) {
		var db = ORM.connect(common.getConnectionString());

		db.on("connect", function (err) {
			should.not.exist(err);

			return done();
		});
	});

	describe("if no connection error", function () {
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

		it("should be able to ping the server", function (done) {
			db.ping(function () {
				return done();
			});
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
				should.equal(err.literalCode, 'NO_SUPPORT');
				should.equal(
					err.message,
					"Connection protocol not supported - have you installed the database driver for unknown?"
				);

				return done();
			});
		});
	});

	if (protocol != 'mongodb') {
		describe("query options", function () {
			it("should understand pool `'false'` from query string", function (done) {
				var connString = common.getConnectionString() + "debug=false&pool=false";
				ORM.connect(connString, function (err, db) {
					should.not.exist(err);
					should.strictEqual(db.driver.opts.pool,  false);
					should.strictEqual(db.driver.opts.debug, false);
					done();
				});
			});

			it("should understand pool `'0'` from query string", function (done) {
				var connString = common.getConnectionString() + "debug=0&pool=0";
				ORM.connect(connString, function (err, db) {
					should.not.exist(err);
					should.strictEqual(db.driver.opts.pool,  false);
					should.strictEqual(db.driver.opts.debug, false);
					done();
				});
			});

			it("should understand pool `'true'` from query string", function (done) {
				var connString = common.getConnectionString() + "debug=true&pool=true";
				ORM.connect(connString, function (err, db) {
					should.not.exist(err);
					should.strictEqual(db.driver.opts.pool,  true);
					should.strictEqual(db.driver.opts.debug, true);
					done();
				});
			});

			it("should understand pool `'1'` from query string", function (done) {
				var connString = common.getConnectionString() + "debug=1&pool=1";
				ORM.connect(connString, function (err, db) {
					should.not.exist(err);
					should.strictEqual(db.driver.opts.pool,  true);
					should.strictEqual(db.driver.opts.debug, true);
					done();
				});
			});

			it("should understand pool `true` from query options", function (done) {
				var connOpts = _.extend(common.getConfig(), {
					protocol: common.protocol(),
					query: {
					  pool: true, debug: true
					}
				});
				ORM.connect(connOpts, function (err, db) {
					should.not.exist(err);
					should.strictEqual(db.driver.opts.pool,  true);
					should.strictEqual(db.driver.opts.debug, true);
					done();
				});
			});

			it("should understand pool `false` from query options", function (done) {
				var connOpts = _.extend(common.getConfig(), {
					protocol: common.protocol(),
					query: {
					  pool: false, debug: false
					}
				});
				ORM.connect(connOpts, function (err, db) {
					should.not.exist(err);
					should.strictEqual(db.driver.opts.pool,  false);
					should.strictEqual(db.driver.opts.debug, false);
					done();
				});
			});
		});
	}
});

describe("ORM.use()", function () {
	it("should be able to use an established connection", function (done) {
		var db = new sqlite.Database(':memory:');

		ORM.use(db, "sqlite", function (err) {
			should.not.exist(err);

			return done();
		});
	});

	it("should be accept protocol alias", function (done) {
		var db = new pg.Client();

		ORM.use(db, "pg", function (err) {
			should.equal(err, null);

			return done();
		});
	});

	it("should return an error in callback if protocol not supported", function (done) {
		var db = new pg.Client();

		ORM.use(db, "unknowndriver", function (err) {
			should.exist(err);

			return done();
		});
	});
});
