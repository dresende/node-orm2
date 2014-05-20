var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');

describe("custom types", function() {
	if (common.protocol() == 'mongodb') return;

	var db = null;

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			done();
		});
	});

	after(function () {
		db.close();
	});

	describe("simple", function () {
		var LottoTicket = null;

		before(function (done) {
			db.defineType('numberArray', {
				datastoreType: function(prop) {
					return 'TEXT'
				},
				valueToProperty: function(value, prop) {
					if (Array.isArray(value)) {
						return value;
					} else {
						return value.split(',').map(function (v) {
							return Number(v);
						});
					}
				},
				propertyToValue: function(value, prop) {
					return value.join(',')
				}
			});

			LottoTicket = db.define('lotto_ticket', {
				numbers: { type: 'numberArray' }
			});

			return helper.dropSync(LottoTicket, done);
		});

		it("should create the table", function () {
			should(true);
		});

		it("should store data in the table", function (done) {
			var ticket = new LottoTicket({ numbers: [4,23,6,45,9,12,3,29] });

			ticket.save(function (err) {
				should.not.exist(err);

				LottoTicket.find().all(function (err, items) {
					should.not.exist(err);
					should.equal(items.length, 1);
					should(Array.isArray(items[0].numbers));

					[4,23,6,45,9,12,3,29].should.eql(items[0].numbers);

					done();
				});
			});
		});

		describe("hasMany extra properties", function () {
			it("should work", function (done) {
				db.defineType('customDate', {
			    datastoreType: function (prop) {
			      return 'TEXT';
			    }
			  });
				var Person = db.define('person', {
					name    : String,
					surname : String,
					age     : Number
				});
				var Pet = db.define('pet', {
					name    : String
				});
				Person.hasMany('pets', Pet, { date: { type: 'customDate' } }, { autoFetch: true });

				return helper.dropSync([ Person, Pet ], function (err) {
					should.not.exist(err);

					Person.create({
						name    : "John",
						surname : "Doe",
						age     : 20
					}, function (err, person) {
						should.not.exist(err);

						Pet.create({ name: 'Fido' }, function (err, pet) {
							should.not.exist(err);

							person.addPets(pet, { date: '2014-05-20' }, function (err) {
								should.not.exist(err);

								Person.get(person.id, function (err, freshPerson) {
									should.not.exist(err);
									should.equal(freshPerson.pets.length, 1);
									should.equal(freshPerson.pets[0].extra.date, '2014-05-20');
									done();
								});
							});
						});
					});
				});
			});
		});
	});

	describe("complex", function () {
		var WonkyTotal = null;

		before(function (done) {
			db.defineType('wonkyNumber', {
				datastoreType: function (prop) {
					return 'INTEGER';
				},
				datastoreGet: function (prop, helper) {
					return helper.escape('?? - 1', [prop.mapsTo]);
				},
				valueToProperty: function (value, prop) {
					return value + 7;
				},
				propertyToValue: function (value, prop) {
					if (value == null) {
						return value;
					} else {
						return function (helper) {
							return helper.escape('(? - 2)', [value]);
						};
					}
				}
			});

			WonkyTotal = db.define('wonky', {
				name:  String,
				total: { type: 'wonkyNumber', mapsTo: 'blah_total' }
			});

			return helper.dropSync(WonkyTotal, done);
		});

		it("should store wonky total in a differently named field", function (done) {
			var item = new WonkyTotal();

			item.name  = "cabbages";
			item.total = 8;

			item.save(function (err) {
				should.not.exist(err);
				should.equal(item.total, 15);

				WonkyTotal.get(item.id, function (err, item) {
					should.not.exist(err);
					should.equal(item.total, 19); // (15 - 2) - 1 + 7

					done();
				});
			});
		});
	});

});
