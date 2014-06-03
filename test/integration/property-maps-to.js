var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');

if (common.protocol() == "mongodb") return;

describe("Property.mapsTo", function() {
	var db = null;

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;
			db.settings.set('instance.cache', false);

			return done();
		});
	});

	after(function () {
		return db.close();
	});

	describe("normal", function () {
		var Book = null;
		var id1 = null, id2 = null;

		before(function (done) {
			Book = db.define("book", {
				title: { type: 'text', mapsTo: 'book_title', required: true },
				pages: { type: 'integer', required: false }
			});
			return helper.dropSync(Book, done);
		});

		it("should create", function (done) {
			Book.create({ title: "History of the wheel", pages: 297 }, function (err, book) {
				should.not.exist(err);
				should.exist(book);
				should.equal(book.title, "History of the wheel");
				id1 = book.id;

				done()
			});
		});

		it("should save new", function (done) {
			book = new Book({ title: "Stuff", pages: 33 })
			book.save(function (err, book) {
				should.not.exist(err);
				should.exist(book);
				should.equal(book.title, "Stuff");
				id2 = book.id;

				done()
			});
		});

		it("should get book1", function (done) {
			Book.get(id1, function (err, book) {
				should.not.exist(err);
				should.exist(book);
				should.equal(book.title, "History of the wheel");
				done();
			});
		});

		it("should get book2", function (done) {
			Book.get(id2, function (err, book) {
				should.not.exist(err);
				should.exist(book);
				should.equal(book.title, "Stuff");
				done();
			});
		});

		it("should find", function (done) {
			Book.one({ title: "History of the wheel" }, function (err, book) {
				should.not.exist(err);
				should.exist(book);
				should.equal(book.title, "History of the wheel");
				done();
			});
		});

		it("should update", function (done) {
			Book.one(function (err, book) {
				should.not.exist(err);
				should.exist(book);
				should.equal(book.title, "History of the wheel");

				book.title = "Quantum theory";
				book.pages = 5;

				book.save(function (err) {
					should.not.exist(err);
					should.equal(book.title, "Quantum theory");

					Book.get(book.id, function (err, freshBook) {
						should.not.exist(err);
						should.exist(freshBook);
						should.equal(book.title, "Quantum theory");
						done();
					});
				});
			});
		});

		it("should order", function (done) {
			Book.create({ title: "Zzz", pages: 2 }, function (err) {
				should.not.exist(err);

				Book.create({ title: "Aaa", pages: 3 }, function (err) {
					should.not.exist(err);

					Book.find().order("-title").all(function (err, items) {
						should.not.exist(err);
						should.equal(
							_.pluck(items, 'title').join(','),
							"Zzz,Stuff,Quantum theory,Aaa"
						)
						Book.find().order("title").all(function (err, items) {
							should.not.exist(err);
							should.equal(
								_.pluck(items, 'title').join(','),
								"Aaa,Quantum theory,Stuff,Zzz"
							)
							done();
						});
					});
				});
			});
		});
	});

	describe("keys", function () {
		var Person = null;
		var id1 = null, id2 = null;

		before(function (done) {
			Person = db.define("person", {
				firstName: { type: 'text', mapsTo: 'first_name', key: true },
				lastName:  { type: 'text', mapsTo: 'last_name',  key: true },
				age:       { type: 'integer' }
			});

			return helper.dropSync(Person, done);
		});

		it("should throw an error if invalid keys are specified", function () {
			(function () {
				db.define("blah", {
					name: { type: 'text' }
				}, {
					id: ['banana']
				});
			}).should.throw("Model defined without any keys");
		});

		it("should create", function (done) {
			Person.create({ firstName: 'John', lastName: 'Smith', age: 48 }, function (err, person) {
				should.not.exist(err);
				should.exist(person);
				should.equal(person.firstName, 'John');
				should.equal(person.lastName,  'Smith');
				id1 = [person.firstName, person.lastName];

				done()
			});
		});

		it("should save new", function (done) {
			person = new Person({ firstName: 'Jane', lastName: 'Doe', age: 50 });

			person.save(function (err) {
				should.not.exist(err);
				should.exist(person);
				should.equal(person.firstName, 'Jane');
				should.equal(person.lastName,  'Doe');
				id2 = [person.firstName, person.lastName];

				done()
			});
		});

		it("should get person1", function (done) {
			Person.get(id1[0], id1[1], function (err, person) {
				should.not.exist(err);
				should.exist(person);
				should.equal(person.firstName, 'John');
				should.equal(person.lastName,  'Smith');
				done();
			});
		});

		it("should get person2", function (done) {
			Person.get(id2[0], id2[1], function (err, person) {
				should.not.exist(err);
				should.exist(person);
				should.equal(person.firstName, 'Jane');
				should.equal(person.lastName,  'Doe');
				done();
			});
		});

		it("should find", function (done) {
			Person.one({ firstName: 'Jane' }, function (err, person) {
				should.not.exist(err);
				should.exist(person);
				should.equal(person.firstName, 'Jane');
				should.equal(person.lastName,  'Doe');
				done();
			});
		});

		it("should update", function (done) {
			Person.one({ firstName: 'Jane' }, function (err, person) {
				should.not.exist(err);
				should.exist(person);

				person.firstName = 'Jeniffer';
				person.save(function (err) {
					should.not.exist(err);

					should.equal(person.firstName, 'Jeniffer');
					should.equal(person.lastName,  'Doe');

					Person.get(person.firstName, person.lastName, function (err, freshPerson) {
						should.not.exist(err);
						should.exist(freshPerson);

						should.equal(freshPerson.firstName, 'Jeniffer');
						should.equal(freshPerson.lastName,  'Doe');

						freshPerson.lastName = 'Dee';
						freshPerson.save(function (err) {
							should.not.exist(err);

							should.equal(freshPerson.firstName, 'Jeniffer');
							should.equal(freshPerson.lastName,  'Dee');

							Person.get(freshPerson.firstName, freshPerson.lastName, function (err, jennifer) {
								should.not.exist(err);

								should.equal(jennifer.firstName, 'Jeniffer');
								should.equal(jennifer.lastName,  'Dee');

								done();
							});
						});
					});
				});
			});
		});
	});
});
