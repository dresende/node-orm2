var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("LazyLoad properties", function() {
	var db = null;
	var Person = null;
	var PersonPhoto = new Buffer(1024); // fake photo
	var OtherPersonPhoto = new Buffer(1024); // other fake photo

	var setup = function () {
		return function (done) {
			Person = db.define("person", {
				name   : String,
				photo  : { type: "binary", lazyload: true }
			});

			ORM.singleton.clear();

			return helper.dropSync(Person, function () {
				Person.create({
					name  : "John Doe",
					photo : PersonPhoto
				}, done);
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

	describe("when defined", function () {
		before(setup());

		it("should not be available when fetching an instance", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");
				John.should.have.property("id", 1);
				John.should.have.property("name", "John Doe");
				John.should.have.property("photo", null);

				return done();
			});
		});

		it("should have apropriate accessors", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");
				John.getPhoto.should.be.a("function");
				John.setPhoto.should.be.a("function");
				John.removePhoto.should.be.a("function");

				return done();
			});
		});

		it("getAccessor should return property", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");

				John.getPhoto(function (err, photo) {
					should.equal(err, null);
					photo.toString().should.equal(PersonPhoto.toString());

					return done();
				});
			});
		});

		it("setAccessor should change property", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");

				John.setPhoto(OtherPersonPhoto, function (err) {
					should.equal(err, null);

					Person.get(1, function (err, John) {
						should.equal(err, null);

						John.should.be.a("object");

						John.getPhoto(function (err, photo) {
							should.equal(err, null);
							photo.toString().should.equal(OtherPersonPhoto.toString());

							return done();
						});
					});
				});
			});
		});

		it("removeAccessor should change property", function (done) {
			Person.get(1, function (err, John) {
				should.equal(err, null);

				John.should.be.a("object");

				John.removePhoto(function (err) {
					should.equal(err, null);

					Person.get(1, function (err, John) {
						should.equal(err, null);

						John.should.be.a("object");

						John.getPhoto(function (err, photo) {
							should.equal(err, null);
							should.equal(photo, null);

							return done();
						});
					});
				});
			});
		});
	});
});
