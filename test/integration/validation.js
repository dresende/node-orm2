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
	var Person2 = null;

	var setup = function (returnAll, required) {
		return function (done) {
			db.settings.set('properties.required',      required);
			db.settings.set('instance.returnAllErrors', returnAll);

			Person = db.define("person", {
				name:   { type: 'text'   },
				height: { type: 'number' },
			}, {
				validations: {
					name:   ORM.validators.rangeLength(3, 30),
					height: ORM.validators.rangeNumber(0.1, 3.0)
				}
			});

			return helper.dropSync(Person, done);
		};
	};

	notNull = function(val, next, data) {
		if (val != null) {
			return next('notnull');
		}
		return next();
	};
	var setupAlwaysValidate = function () {
		return function (done) {
			Person2 = db.define("person2", {
				name:   { type: 'text'   },
				mustbenull: { type: 'text', required:false, alwaysValidate: true }
				, canbenull: { type: 'text', required:false }
			}, {
				validations: {
					name:   ORM.validators.rangeLength(3, 30),
					mustbenull: notNull,
					canbenull: notNull
				}
			});
			return helper.dropSync(Person2, done);
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


	describe("alwaysValidate", function () {
		before(setupAlwaysValidate());

		it("I want to see it fail first (the absence of evidence)", function(done) {
			var rachel = new Person2({name: 'rachel', canbenull:null, mustbenull:null});
			rachel.save(function (err) {
				should.not.exist(err);
				return done();
			});
		});

		it("then it should work", function(done) {
			var tom = new Person2({name: 'tom', canbenull:null, mustbenull:'notnull'});
			tom.save(function (err) {
				should.exist(err);
				should.equal(typeof err,   "object");
				should.equal(err.property, "mustbenull");
				should.equal(err.msg,      "notnull");
				should.equal(err.type,     "validation");
				should.equal(tom.id,      null);
				return done();
			});
		});
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

			var Product = null, Supplier = null;

			var setupUnique = function (ignoreCase, scope, msg) {
				return function (done) {
					Supplier = db.define("supplier", {
						name     : String
                    }, {
						cache: false
					});
					helper.dropSync(Supplier, function(err){
						if (err) {
							return done(err);
						}

						Product = db.define("productUnique", {
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
				        Product.hasOne('supplier',  Supplier,  { field: 'supplierId' });

						return helper.dropSync(Product, done);
					});
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

					before(setupUnique(true, ['category']));

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

					it("should pass if other property is different", function (done) {
						Product.create({name: 'blue', category: 'chair'}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'blue', category: 'pen'}, function (err, product) {
								should.not.exist(err);

								return done();
							});
						});
					});

					// In SQL unique index land, NULL values are not considered equal.
					it("should pass if other property is null", function (done) {
						Product.create({name: 'blue', category: null}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'blue', category: null}, function (err, product) {
								should.not.exist(err);

								return done();
							});
						});
					});
				});

				describe("to hasOne property", function () {
					firstId = secondId = null;

					before(function(done){
						setupUnique(true, ['supplierId'])(function(err) {
							should.not.exist(err);
							Supplier.create({name: 'first'}, function (err, supplier) {
								should.not.exist(err);

								firstId = supplier.id;

								Supplier.create({name: 'second'}, function (err, supplier) {
									should.not.exist(err);

									secondId = supplier.id;
									done();
								});
							});
						});
					});

					it("should return validation error if hasOne property also matches", function(done) {
						Product.create({name: 'red', supplierId: firstId}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'red', supplierId: firstId}, function (err, product) {
								should.exist(err);
								should.equal(err.msg, 'not-unique');

								return done();
							});
						});
					});

					it("should pass if hasOne property is different", function (done) {
						Product.create({name: 'blue', supplierId: firstId}, function (err, product) {
							should.not.exist(err);

							Product.create({name: 'blue', supplierId: secondId}, function (err, product) {
								should.not.exist(err);

								return done();
							});
						});
					});

					// In SQL unique index land, NULL values are not considered equal.
					it("should pass if other property is null", function (done) {
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

					should.deepEqual(err[0], _.extend(new Error('out-of-range-length'), {
						property: 'name', value: 'n', msg: 'out-of-range-length', type: 'validation'
					}));

					should.deepEqual(err[1], _.extend(new Error(),{
						property: 'height', value: '4', msg: 'out-of-range-number', type: 'validation'
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

					should.deepEqual(err[0], _.extend(new Error(),{
						property: 'name', value: null, msg: 'required', type: 'validation'
					}));

					should.deepEqual(err[1], _.extend(new Error(),{
						property: 'name', value: null, msg: 'undefined', type: 'validation'
					}));

					should.deepEqual(err[2], _.extend(new Error(),{
						property: 'height', value: '4', msg: 'out-of-range-number', type: 'validation'
					}));

					should.equal(john.id, null);

					return done();
				});
			});
		});
	});

	describe("mockable", function() {
		before(setup());

		it("validate should be writable", function(done) {
			var John = new Person({
				name: "John"
			});
			var validateCalled = false;
			John.validate = function(cb) {
				validateCalled = true;
				cb(null);
			};
			John.validate(function(err) {
				should.equal(validateCalled,true);
				return done();
			});
		});
	});


});

