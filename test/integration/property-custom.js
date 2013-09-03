var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');

describe("custom types", function() {
	if (common.protocol() == 'mongodb') return;

	var db = null;
	var LottoTicket = null;

	var setup = function (opts) {
		return function (done) {
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
		};
	};

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			return done();
		});
	});

	after(function () {
		db.close();
	});

	it("should create the table", function (done) {
		setup()(done);
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
