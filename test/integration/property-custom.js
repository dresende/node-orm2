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
