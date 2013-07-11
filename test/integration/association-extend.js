var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Model.extendsTo()", function() {
	var db = null;
	var Person = null;
	var PersonAddress = null;

	var setup = function () {
		return function (done) {
			Person = db.define("person", {
				name   : String
			});
			PersonAddress = Person.extendsTo("address", {
				street : String,
				number : Number
			});

			ORM.singleton.clear();

			return helper.dropSync([ Person, PersonAddress ], function () {
				Person.create({
					name: "John Doe"
				}, function (err, person) {
					return person.setAddress(new PersonAddress({
						street : "Liberty",
						number : 123
					}), done);
				});
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

	describe("when calling hasAccessor", function () {
		before(setup());

		it("should return true if found", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.hasAddress(function (err, hasAddress) {
					should.equal(err, null);
					hasAddress.should.equal(true);

					return done();
				});
			});
		});

		it("should return false if not found", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.removeAddress(function () {
					John.hasAddress(function (err, hasAddress) {
						err.should.be.a("object");
						hasAddress.should.equal(false);

						return done();
					});
				});
			});
		});

		it("should return error if instance not with an ID", function (done) {
			var Jane = new Person({
				name: "Jane"
			});
			Jane.hasAddress(function (err, hasAddress) {
				err.should.be.a("object");
				err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);

				return done();
			});
		});
	});

	describe("when calling getAccessor", function () {
		before(setup());

		it("should return extension if found", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.getAddress(function (err, Address) {
					should.equal(err, null);
					Address.should.be.a("object");
					Address.should.have.property("street", "Liberty");

					return done();
				});
			});
		});

		it("should return error if not found", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.removeAddress(function () {
					John.getAddress(function (err, Address) {
						err.should.be.a("object");
						err.should.have.property("code", ORM.ErrorCodes.NOT_FOUND);

						return done();
					});
				});
			});
		});

		it("should return error if instance not with an ID", function (done) {
			var Jane = new Person({
				name: "Jane"
			});
			Jane.getAddress(function (err, Address) {
				err.should.be.a("object");
				err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);

				return done();
			});
		});
	});

	describe("when calling setAccessor", function () {
		before(setup());

		it("should remove any previous extension", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				PersonAddress.find({ number: 123 }).count(function (err, c) {
					should.equal(err, null);
					c.should.equal(1);

					var addr = new PersonAddress({
						street : "4th Ave",
						number : 4
					});

					John.setAddress(addr, function (err) {
						should.equal(err, null);

						John.getAddress(function (err, Address) {
							should.equal(err, null);
							Address.should.be.a("object");
							Address.should.have.property("street", addr.street);

							PersonAddress.find({ number: 123 }).count(function (err, c) {
								should.equal(err, null);
								c.should.equal(0);

								return done();
							});
						});
					});
				});
			});
		});
	});

	describe("when calling delAccessor", function () {
		before(setup());

		it("should remove any extension", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				PersonAddress.find({ number: 123 }).count(function (err, c) {
					should.equal(err, null);
					c.should.equal(1);

					var addr = new PersonAddress({
						street : "4th Ave",
						number : 4
					});

					John.removeAddress(function (err) {
						should.equal(err, null);

						PersonAddress.find({ number: 123 }).count(function (err, c) {
							should.equal(err, null);
							c.should.equal(0);

							return done();
						});
					});
				});
			});
		});

		it("should return error if instance not with an ID", function (done) {
			var Jane = new Person({
				name: "Jane"
			});
			Jane.removeAddress(function (err) {
				err.should.be.a("object");
				err.should.have.property("code", ORM.ErrorCodes.NOT_DEFINED);

				return done();
			});
		});
	});
});
