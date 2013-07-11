var should   = require('should');
var common   = require('../common');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var protocol = common.protocol().toLowerCase();

// Round because different systems store floats in different
// ways, thereby introducing small errors.
function round(num, points) {
  var m = Math.pow(10, points);

  return Math.round(num * m) / m;
}

function fuzzyEql(num1, num2) {
	return round(num1 / num2, 3) == 1;
}

if (protocol != "sqlite") {
	describe("Number Properties", function() {
		var db = null;
		var NumberSize = null;
		var NumberData = {
			int2   : 32700,
			int4   : 2147483000,
			int8   : 2251799813685248,
			float4 : 1 * Math.pow(10, 36),
			float8 : 1 * Math.pow(10, 306)
		};

		var setup = function () {
			return function (done) {
				NumberSize = db.define("number_size", {
					int2   : { type: 'number', size: 2, rational: false },
					int4   : { type: 'number', size: 4, rational: false },
					int8   : { type: 'number', size: 8, rational: false },
					float4 : { type: 'number', size: 4 },
					float8 : { type: 'number', size: 8 }
				});

				return helper.dropSync(NumberSize, function () {
					NumberSize.create(NumberData, done);
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

		describe("when storing", function () {
			before(setup());

			it("should be able to store near MAX sized values for each field", function (done) {
				NumberSize.one(function (err, Item) {
					should.equal(err, null);

					should(fuzzyEql(Item.int2,   NumberData.int2));
					should(fuzzyEql(Item.int4,   NumberData.int4));
					should(fuzzyEql(Item.int8,   NumberData.int8));
					should(fuzzyEql(Item.float4, NumberData.float4));
					should(fuzzyEql(Item.float8, NumberData.float8));

					return done();
				});
			});

			it("should not be able to store int2 values which are too large", function (done) {
				NumberSize.create({ int2 : NumberData.int4 }, function (err, item) {
					if (protocol == "mysql") {
						should.equal(err, null);

						return NumberSize.get(item.id, function (err, item) {
							should(!fuzzyEql(item.int2, NumberData.int4));

							return done();
						});
					} else {
						err.should.be.a("object");
					}

					return done();
				});
			});

			it("should not be able to store int4 values which are too large", function (done) {
				NumberSize.create({ int4 : NumberData.int8 }, function (err, item) {
					if (protocol == "mysql") {
						should.equal(err, null);

						return NumberSize.get(item.id, function (err, item) {
							should(!fuzzyEql(item.int4, NumberData.int8));

							return done();
						});
					} else {
						err.should.be.a("object");
					}

					return done();
				});
			});

			it("should not be able to store float4 values which are too large", function (done) {
				NumberSize.create({ float4 : NumberData.float8 }, function (err, item) {
					if (protocol == "mysql") {
						should.equal(err, null);

						return NumberSize.get(item.id, function (err, item) {
							should(!fuzzyEql(item.float4, NumberData.float8));

							return done();
						});
					} else {
						err.should.be.a("object");
					}

					return done();
				});
			});
		});
	});
}
