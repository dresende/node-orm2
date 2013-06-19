var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.save()", function() {
	var db = null;
	var Person = null;

	var setup = function (nameDefinition, opts) {
		return function (done) {
			Person = db.define("person", {
				name   : nameDefinition || String
			}, opts || {});

			Person.hasOne("parent");

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

	describe("if properties have default values", function () {
		before(setup({ type: "text", defaultValue: "John" }));

		it("should use it if not defined", function (done) {
			var John = new Person();

			John.save(function (err) {
				should.equal(err, null);
				John.name.should.equal("John");

				return done();
			});
		});
	});

	describe("with callback", function () {
		before(setup());

		it("should save item and return id", function (done) {
			var John = new Person({
				name: "John"
			});
			John.save(function (err) {
				should.equal(err, null);
				John.id.should.be.a("number");

				Person.get(John.id, function (err, JohnCopy) {
					should.equal(err, null);

					JohnCopy.id.should.equal(John.id);
					JohnCopy.name.should.equal(John.name);

					return done();
				});
			});
		});
	});

	describe("without callback", function () {
		before(setup());

		it("should still save item and return id", function (done) {
			var John = new Person({
				name: "John"
			});
			John.save();
			John.on("save", function (err) {
				should.equal(err, null);
				John.id.should.be.a("number");

				Person.get(John.id, function (err, JohnCopy) {
					should.equal(err, null);

					JohnCopy.id.should.equal(John.id);
					JohnCopy.name.should.equal(John.name);

					return done();
				});
			});
		});
	});

	describe("with properties object", function () {
		before(setup());

		it("should update properties, save item and return id", function (done) {
			var John = new Person({
				name: "Jane"
			});
			John.save({ name: "John" }, function (err) {
				should.equal(err, null);
				John.id.should.be.a("number");
				John.name.should.equal("John");

				Person.get(John.id, function (err, JohnCopy) {
					should.equal(err, null);

					JohnCopy.id.should.equal(John.id);
					JohnCopy.name.should.equal(John.name);

					return done();
				});
			});
		});
	});

	describe("with unknown argument type", function () {
		before(setup());

		it("should should throw", function (done) {
			var John = new Person({
				name: "Jane"
			});
			(function () {
				John.save("will-fail");
			}).should.throw();

			return done();
		});
	});

	describe("if passed an association instance", function () {
		before(setup());

		it("should save association first and then save item and return id", function (done) {
			var Jane = new Person({
				name  : "Jane"
			});
			var John = new Person({
				name  : "John",
				parent: Jane
			});
			John.save(function (err) {
				should.equal(err, null);
				John.saved().should.be.true;
				Jane.saved().should.be.true;

				John.id.should.be.a("number");
				Jane.id.should.be.a("number");

				return done();
			});
		});
	});

	describe("if passed an association object", function () {
		before(setup());

		it("should save association first and then save item and return id", function (done) {
			var John = new Person({
				name  : "John",
				parent: {
					name  : "Jane"
				}
			});
			John.save(function (err) {
				should.equal(err, null);
				John.saved().should.be.true;
				John.parent.saved().should.be.true;

				John.id.should.be.a("number");
				John.parent.id.should.be.a("number");

				return done();
			});
		});
	});

	describe("if autoSave is on", function () {
		before(setup(null, { autoSave: true }));

		it("should save the instance as soon as a property is changed", function (done) {
			var John = new Person({
				name : "Jhon"
			});
			John.save(function (err) {
				should.equal(err, null);

				John.on("save", function () {
					return done();
				});

				John.name = "John";
			});
		});
	});
});
