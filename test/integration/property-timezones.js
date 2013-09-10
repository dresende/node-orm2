var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');

// Only MySql support for now
if (common.protocol() != 'mysql') return;

describe("Timezones", function() {
	var db    = null;
	var Event = null;

	var setup = function (opts) {
		return function (done) {
			helper.connect({ query: opts.query }, function (connection) {
				db = connection;
				db.settings.set('instance.cache', false);

				Event = db.define("event", {
					name : { type: 'text' },
					when : { type: 'date', time: true }
				});

				if (opts.sync) {
					return helper.dropSync(Event, done);
				} else {
					return done();
				}
			});
		};
	};

	describe("specified", function () {
		var a, zones = ['local', '-0734', '+11:22'];

		for (a = 0; a < zones.length; a++ ) {
			describe(zones[a], function () {
				before(setup({ sync: true, query: { timezone: zones[a] } }));

				after(function () {
					return db.close();
				});

				it("should get back the same date that was stored", function (done) {
					var when = new Date(2013,12,5,5,34,27);

					Event.create({ name: "raid fridge", when: when }, function (err) {
						should.not.exist(err);

						Event.one({ name: "raid fridge" }, function (err, item) {
							should.not.exist(err);
							when.should.eql(item.when);

							done();
						});
					});
				});
			});
		}
	});

	describe("different for each connection", function () {
		after(function () {
			return db.close();
		});

		it("should get back a correctly offset time", function (done) {
			var when = new Date(2013,12,5,5,34,27);

			setup({ sync: true, query: { timezone: '+0200' }})(function () {
				Event.create({ name: "raid fridge", when: when }, function (err) {
					should.not.exist(err);

					Event.one({ name: "raid fridge" }, function (err, item) {
						should.not.exist(err);
						when.should.eql(item.when);

						db.close();

						setup({ query: { timezone: '+0400' }})(function () {
							Event.one({ name: "raid fridge" }, function (err, item) {
								var expected = new Date(2013,12,5,3,34,27);

								should.not.exist(err);
								expected.should.eql(item.when);

								done();
							});
						});
					});
				});
			});
		});
	});

});
