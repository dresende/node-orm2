var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');

if (common.protocol() == "mongodb") return;

describe("Property.mapsTo", function() {
	var db = null;
	var Book = null;
	var id1 = null, id2 = null;

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;
			db.settings.set('instance.cache', false);

			return done();
		});
	});

	before(function (done) {
		Book = db.define("book", {
			title: { type: 'text', mapsTo: 'book_title', required: true },
			pages: { type: 'integer', required: false }
		});

		return helper.dropSync(Book, done);
	});

	after(function () {
		return db.close();
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
