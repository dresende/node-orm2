var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var async    = require('async');
var common   = require('../common');
var protocol = common.protocol().toLowerCase();
var ORM      = require('../../');

describe("Validations", function() {
	var db = null;
	var Person = null;

	var setup = function (returnAll, required) {
		return function (done) {
			db.settings.set('properties.required',      required);
			db.settings.set('instance.returnAllErrors', returnAll);

			Person = db.define("person", {
				name:   { type: 'text'   },
				height: { type: 'number' }
			}, {
				validations: {
					name:   ORM.validators.rangeLength(3, 30),
					height: ORM.validators.rangeNumber(0.1, 3.0)
				}
			});

			return helper.dropSync(Person, done);
		};
	};

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

	after(function () {
		db.close();
	});

	describe("predefined", function () {
		before(setup(false, false));

		it("should work", function(done) {
			var john = new Person({name: 'fdhdjendfjkdfhshdfhakdfjajhfdjhbfgk'});

			john.save(function (err) {
				should.equal(typeof err,   "object");
				should.equal(err.property, "name");
				should.equal(err.value,    "fdhdjendfjkdfhshdfhakdfjajhfdjhbfgk");
				should.equal(err.msg,      "out-of-range-length");
				should.equal(err.type,     "validation");
				should.equal(john.id,      null);

				return done();
			});
		});

		describe("unique", function () {
		    if (protocol === "mongodb") return;

			var Product = null;

			var setupUnique = function (ignoreCase, scope, msg) {
				return function (done) {
					Product = db.define("product_unique", {
						instock  : { type: 'boolean', required: true, defaultValue: false },
						name     : String,
						category : String
					}, {
						cache: false,
						validations: {
							name      : ORM.validators.unique({ ignoreCase: ignoreCase, scope: scope }, msg),
							instock   : ORM.validators.required(),
							productId : ORM.validators.unique() // this must be straight after a required & validated row.
						}
					});
					Product.hasOne('product', Product, { field: 'productId', required: false, autoFetch: true });

					return helper.dropSync(Product, done);
				};
			};

			describe("simple", function () {
				before(setupUnique(false, false));

				it("should return validation error for duplicate name", function (done) {
					Product.create({name: 'fork'}, function (err, product) {
						should.not.exist(err);

						Product.create({name: 'fork'}, function (err, product) {
							should.exist(err);

							return done();
						});
					});
				});

				it("should pass with different names", function (done) {
					Product.create({name: 'spatula'}, function (err, product) {
						should.not.exist(err);

						Product.create({name: 'plate'}, function (err, product) {
							should.not.exist(err);

							return done();
						});
					});
				});

				// Technically this is covered by the tests above, but I'm putting it here for clarity's sake. 3 HOURS WASTED *sigh.
				it("should not leak required state from previous validation for association properties [regression test]", function (done) {
					Product.create({ name: 'pencil', productId: null}, function (err, product) {
						should.not.exist(err);

						Product.create({ name: 'pencilcase', productId: null }, function (err, product) {
							should.not.exist(err);

							return done();
						});
					});
				});
			});

			describe("scope", function () {
				describe("to other property", function () {
					before(setupUnique(false, ['category']));

					it("should return validation error if other property also matches", function(done) {
						Product.create({name: 'red', category: 'chair'}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'red', category: 'chair'}, function (err, product) {
								should.exist(err);
								should.equal(err.msg, 'not-unique');

								return done();
							});
						});
					});

					it("should pass if other peroperty is different", function (done) {
						Product.create({name: 'blue', category: 'chair'}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'blue', category: 'pen'}, function (err, product) {
								should.not.exist(err);

								return done();
							});
						});
					});

					// In SQL unique index land, NULL values are not considered equal.
					it("should pass if other peroperty is null", function (done) {
						Product.create({name: 'blue', category: null}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'blue', category: null}, function (err, product) {
								should.not.exist(err);

								return done();
							});
						});
					});
				});
			});

			describe("ignoreCase", function () {
				if (protocol != 'mysql') {
					it("false should do a case sensitive comparison", function (done) {
						setupUnique(false, false)(function (err) {
							should.not.exist(err);

							Product.create({name: 'spork'}, function (err, product) {
								should.not.exist(err);

								Product.create({name: 'spOrk'}, function (err, product) {
									should.not.exist(err);

									return done();
								});
							});
						});
					});
				}

				it("true should do a case insensitive comparison", function (done) {
					setupUnique(true, false)(function (err) {
						should.not.exist(err);

						Product.create({name: 'stapler'}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'staplER'}, function (err, product) {
								should.exist(err);
								should.equal(err.msg, 'not-unique');

								return done();
							});
						});
					});
				});

				it("true should do a case insensitive comparison on scoped properties too", function (done) {
					setupUnique(true, ['category'], "name already taken for this category")(function (err) {
						should.not.exist(err);

						Product.create({name: 'black', category: 'pen'}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'Black', category: 'Pen'}, function (err, product) {
								should.exist(err);
								should.equal(err.msg, "name already taken for this category");

								return done();
							});
						});
					});
				});
			});
		});
	});

	describe("instance.returnAllErrors = false", function() {
		describe("properties.required = false", function() {
			before(setup(false, false));

			it("should save when properties are null", function(done) {
				var john = new Person();

				john.save(function (err) {
					should.equal(err, null);
					should.exist(john[Person.id]);

					return done();
				});
			});

			it("shouldn't save when a property is invalid", function(done) {
				var john = new Person({ height: 4 });

				john.save(function (err) {
					should.notEqual(err, null);
					should.equal(err.property, 'height');
					should.equal(err.value,     4);
					should.equal(err.msg,      'out-of-range-number');
					should.equal(err.type,     'validation');
					should.equal(john.id,      null);

					return done();
				});
			});
		});

		describe("properties.required = true", function() {
			before(setup(false, true));

			it("should not save when properties are null", function(done) {
				var john = new Person();

				john.save(function (err) {
					should.notEqual(err, null);
					should.equal(john.id, null);

					return done();
				});
			});

			it("should return a required error when the first property is blank", function(done) {
				var john = new Person({ height: 4 });

				john.save(function (err) {
					should.notEqual(err, null);
					should.equal(err.property, 'name');
					should.equal(err.value,    null);
					should.equal(err.msg,      'required');
					should.equal(err.type,     'validation');
					should.equal(john.id,      null);

					return done();
				});
			});
		});
	});

	describe("instance.returnAllErrors = true", function() {
		describe("properties.required = false", function() {
			before(setup(true, false));

			it("should return all errors when a property is invalid", function(done) {
				var john = new Person({ name: 'n', height: 4 });

				john.save(function (err) {
					should.notEqual(err, null);
					should(Array.isArray(err));
					should.equal(err.length, 2);

					should.deepEqual(err[0], _.extend(new Error(),{
						property: 'name', value: 'n', msg: 'out-of-range-length'
					}));

					should.deepEqual(err[1], _.extend(new Error(),{
						property: 'height', value: '4', msg: 'out-of-range-number'
					}));

					should.equal(john.id, null);

					return done();
				});
			});
		});

		describe("properties.required = true", function() {
			before(setup(true, true));

			it("should return required and user specified validation errors", function(done) {
				var john = new Person({ height: 4 });

				john.save(function (err) {
					should.notEqual(err, null);
					should(Array.isArray(err));
					should.equal(err.length, 3);

					// `type` is a non enumerable undocumented property of `Error` in V8.
					should.deepEqual(err[0], _.extend(new Error(),{
						property: 'name', value: null, msg: 'required'
					}));

					should.deepEqual(err[1], _.extend(new Error(),{
						property: 'name', value: null, msg: 'undefined'
					}));

					should.deepEqual(err[2], _.extend(new Error(),{
						property: 'height', value: '4', msg: 'out-of-range-number'
					}));

					should.equal(john.id, null);

					return done();
				});
			});
		});
	});
});
