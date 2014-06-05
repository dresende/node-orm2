var should	= require('should');
var helper	= require('../support/spec_helper');
var common  = require('../common');
var ORM			= require('../../');

describe("Model instance", function() {
	var db = null;
	var Person = null;
	var protocol = common.protocol();

	var setup = function () {
		return function (done) {
			db.settings.set('instance.returnAllErrors', true);

			Person = db.define("person", {
				name   : String,
				age    : { type: 'integer', required: false },
				height : { type: 'integer', required: false },
				weight : { type: 'number',  required: false },
				data   : { type: 'object',  required: false }
			}, {
				cache: false,
				validations: {
					age: ORM.validators.rangeNumber(0, 150)
				}
			});

			return helper.dropSync(Person, function () {
				Person.create([{
					name: "Jeremy Doe"
				}, {
					name: "John Doe"
				}, {
					name: "Jane Doe"
				}], done);
			});
		};
	};

	before(function (done) {
		this.timeout(4000);

		helper.connect(function (connection) {
			db = connection;

			setup()(function (err) {
				return done();
			});
		});
	});

	after(function () {
		return db.close();
	});

	describe("#save", function () {
		var main_item, item;

		before(function (done) {
			main_item = db.define("main_item", {
				name      : String
			}, {
				auteFetch : true
			});
			item = db.define("item", {
				name      : String
			}, {
				cache     : false
			});
			item.hasOne("main_item", main_item, {
				reverse   : "items",
				autoFetch : true
			});

			return helper.dropSync([ main_item, item ], function () {
				main_item.create({
					name : "Main Item"
				}, function (err, mainItem) {
					item.create({
						name : "Item"
					}, function (err, Item) {
						mainItem.setItems(Item, function (err) {
							should.not.exist(err);

							return done();
						});
					});
				});
			});
		});

		it("should have a saving state to avoid loops", function (done) {
			main_item.find({ name : "Main Item" }).first(function (err, mainItem) {
				mainItem.save({ name : "new name" }, function (err) {
					should.not.exist(err);
					return done();
				});
			});
		});
	});

	describe("#isInstance", function () {
		it("should always return true for instances", function (done) {
			should.equal((new Person).isInstance, true);
			should.equal((Person(4)).isInstance, true);

			Person.find().first(function (err, item) {
				should.not.exist(err);
				should.equal(item.isInstance, true);
				return done();
			});
		});

		it("should be false for all other objects", function () {
			should.notEqual({}.isInstance, true);
			should.notEqual([].isInstance, true);
		});
	});

	describe("#isPersisted", function () {
		it("should return true for persisted instances", function (done) {
			Person.find().first(function (err, item) {
				should.not.exist(err);
				should.equal(item.isPersisted(), true);
				return done();
			});
		});

		it("should return true for shell instances", function () {
			should.equal(Person(4).isPersisted(), true);
		});

		it("should return false for new instances", function () {
			should.equal((new Person).isPersisted(), false);
		});

		it("should be writable for mocking", function() {
			var person = new Person()
			var triggered = false;
			person.isPersisted = function() {
				triggered = true;
			};
			person.isPersisted()
			triggered.should.be.true;
		});
	});

	describe("#set", function () {
		var person = null;
		var data = null;

		function clone(obj) { return JSON.parse(JSON.stringify(obj)) };

		beforeEach(function (done) {
			data = {
				a: {
					b: {
						c: 3,
						d: 4
					}
				},
				e: 5
			};
			Person.create({ name: 'Dilbert', data: data }, function (err, p) {
				if (err) return done(err);

				person = p;
				done();
			});
		});

		it("should do nothing with flat paths when setting to same value", function () {
			should.equal(person.saved(), true);
			person.set('name', 'Dilbert');
			should.equal(person.name, 'Dilbert');
			should.equal(person.saved(), true);
		});

		it("should mark as dirty with flat paths when setting to different value", function () {
			should.equal(person.saved(), true);
			person.set('name', 'Dogbert');
			should.equal(person.name, 'Dogbert');
			should.equal(person.saved(), false);
			should.equal(person.__opts.changes.join(','), 'name');
		});

		it("should do nothin with deep paths when setting to same value", function () {
			should.equal(person.saved(), true);
			person.set('data.e', 5);

			var expected = clone(data);
			expected.e = 5;

			should.equal(JSON.stringify(person.data), JSON.stringify(expected));
			should.equal(person.saved(), true);
		});

		it("should mark as dirty with deep paths when setting to different value", function () {
			should.equal(person.saved(), true);
			person.set('data.e', 6);

			var expected = clone(data);
			expected.e = 6;

			should.equal(JSON.stringify(person.data), JSON.stringify(expected));
			should.equal(person.saved(), false);
			should.equal(person.__opts.changes.join(','), 'data');
		});

		it("should do nothing with deeper paths when setting to same value", function () {
			should.equal(person.saved(), true);
			person.set('data.a.b.d', 4);

			var expected = clone(data);
			expected.a.b.d = 4;

			should.equal(JSON.stringify(person.data), JSON.stringify(expected));
			should.equal(person.saved(), true);
		});

		it("should mark as dirty with deeper paths when setting to different value", function () {
			should.equal(person.saved(), true);
			person.set('data.a.b.d', 6);

			var expected = clone(data);
			expected.a.b.d = 6;

			should.equal(JSON.stringify(person.data), JSON.stringify(expected));
			should.equal(person.saved(), false);
			should.equal(person.__opts.changes.join(','), 'data');
		});

		it("should mark as dirty with array path when setting to different value", function () {
			should.equal(person.saved(), true);
			person.set(['data', 'a', 'b', 'd'], 6);

			var expected = clone(data);
			expected.a.b.d = 6;

			should.equal(JSON.stringify(person.data), JSON.stringify(expected));
			should.equal(person.saved(), false);
			should.equal(person.__opts.changes.join(','), 'data');
		});

		it("should do nothing with invalid paths", function () {
			should.equal(person.saved(), true);
			person.set('data.a.b.d.y.z', 1);
			person.set('data.y.z', 1);
			person.set('z', 1);
			person.set(4, 1);
			person.set(null, 1);
			person.set(undefined, 1);
			should.equal(person.saved(), true);
		});
	});

	describe("#markAsDirty", function () {
		var person = null;

		beforeEach(function (done) {
			Person.create({ name: 'John', age: 44, data: { a: 1 } }, function (err, p) {
				if (err) return cb(err);

				person = p;
				done();
			});
		});

		it("should mark individual properties as dirty", function () {
			should.equal(person.saved(), true);
			person.markAsDirty('name');
			should.equal(person.saved(), false);
			should.equal(person.__opts.changes.join(','), 'name');
			person.markAsDirty('data');
			should.equal(person.__opts.changes.join(','), 'name,data');
		});
	});

	describe("#isShell", function () {
		it("should return true for shell models", function () {
			should.equal(Person(4).isShell(), true);
		});

		it("should return false for new models", function () {
			should.equal((new Person).isShell(), false);
		});

		it("should return false for existing models", function (done) {
			Person.find().first(function (err, item) {
				should.not.exist(err);
				should.equal(item.isShell(), false);
				return done();
			});
		});
	});

	describe("#validate", function () {
		it("should return validation errors if invalid", function (done) {
			var person = new Person({ age: -1 });

			person.validate(function (err, validationErrors) {
				should.not.exist(err);
				should.equal(Array.isArray(validationErrors), true);

				return done();
			});
		});

		it("should return false if valid", function (done) {
			var person = new Person({ name: 'Janette' });

			person.validate(function (err, validationErrors) {
				should.not.exist(err);
				should.equal(validationErrors, false);

				return done();
			});
		});
	});

	describe("properties", function () {
		describe("Number", function () {
			it("should be saved for valid numbers, using both save & create", function (done) {
				var person1 = new Person({ height: 190 });

				person1.save(function (err) {
					should.not.exist(err);

					Person.create({ height: 170 }, function (err, person2) {
						should.not.exist(err);

						Person.get(person1[Person.id], function (err, item) {
							should.not.exist(err);
							should.equal(item.height, 190);

							Person.get(person2[Person.id], function (err, item) {
								should.not.exist(err);
								should.equal(item.height, 170);
								done();
							});
						});
					});
				});
			});

			if (protocol == 'postgres') {
				// Only postgres raises propper errors.
				// Sqlite & Mysql fail silently and insert nulls.
				it("should raise an error for NaN integers", function (done) {
					var person = new Person({ height: NaN });

					person.save(function (err) {
						should.exist(err);
						var msg = {
							postgres : 'invalid input syntax for integer: "NaN"'
						}[protocol];

						should.equal(err.message, msg);

						done();
					});
				});

				it("should raise an error for Infinity integers", function (done) {
					var person = new Person({ height: Infinity });

					person.save(function (err) {
						should.exist(err);
						var msg = {
							postgres : 'invalid input syntax for integer: "Infinity"'
						}[protocol];

						should.equal(err.message, msg);

						done();
					});
				});

				it("should raise an error for nonsensical integers, for both save & create", function (done) {
					var person = new Person({ height: 'bugz' });

					person.save(function (err) {
						should.exist(err);
						var msg = {
							postgres : 'invalid input syntax for integer: "bugz"'
						}[protocol];

						should.equal(err.message, msg);

						Person.create({ height: 'bugz' }, function (err, instance) {
							should.exist(err);
							should.equal(err.message, msg);

							done();
						});
					});
				});
			}

			if (protocol != 'mysql') {
				// Mysql doesn't support IEEE floats (NaN, Infinity, -Infinity)
				it("should store NaN & Infinite floats", function (done) {
					var person = new Person({ weight: NaN });

					person.save(function (err) {
						should.not.exist(err);

						Person.get(person[Person.id], function (err, person) {
							should.not.exist(err);
							should(isNaN(person.weight));

							person.save({ weight: Infinity, name: 'black hole' }, function (err) {
								should.not.exist(err);

								Person.get(person[Person.id], function (err, person) {
									should.not.exist(err);
									should.strictEqual(person.weight, Infinity);

									done();
								});
							});
						});
					});
				});
			}
		});
	});
});
