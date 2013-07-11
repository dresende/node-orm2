var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Event", function() {
	var db = null;
	var Person = null;

	var triggeredHooks = {};

	var checkHook = function (hook) {
		triggeredHooks[hook] = false;

		return function () {
			triggeredHooks[hook] = Date.now();
		};
	};

	var setup = function (hooks) {
		return function (done) {
			Person = db.define("person", {
				name   : { type: "text", required: true }
			});

			return helper.dropSync(Person, done);
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

	describe("save", function () {
		before(setup());

		it("should trigger when saving an instance", function (done) {
			var triggered = false;
			var John = new Person({
				name : "John Doe"
			});

			John.on("save", function () {
				triggered = true;
			});

			triggered.should.be.false;

			John.save(function () {
				triggered.should.be.true;

				return done();
			});
		});

		it("should trigger when saving an instance even if it fails", function (done) {
			var triggered = false;
			var John = new Person();

			John.on("save", function (err) {
				triggered = true;

				err.should.be.a("object");
				err.should.have.property("msg", "required");
			});

			triggered.should.be.false;

			John.save(function () {
				triggered.should.be.true;

				return done();
			});
		});
	});
});
