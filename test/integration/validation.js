var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var async    = require('async');
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
				should.equal(typeof err, "object");
				should.equal(err.field,  'name');
				should.equal(err.value,  'fdhdjendfjkdfhshdfhakdfjajhfdjhbfgk');
				should.equal(err.msg,    'out-of-range-length');
				should.equal(err.type,   'validation');
				should.equal(john.id,     null);

				return done();
			});
		});

		it("unique validator should work", function(done) {
			var Product = db.define("person_unique", { name: String }, {
				validations: { name: ORM.validators.unique() }
			});
			var create = function (cb) {
				var p = new Product({ name: 'broom' });

				return p.save(cb);
			};

			helper.dropSync(Product, function() {
				create(function (err) {
					should.equal(err, null);
					create(function (err) {
						should.deepEqual(err, _.extend(new Error(),{
							field: 'name', value: 'broom', msg: 'not-unique'
						}));
						return done();
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
					john.id.should.be.a('number');

					return done();
				});
			});

			it("shouldn't save when a property is invalid", function(done) {
				var john = new Person({ height: 4 });

				john.save(function (err) {
					should.notEqual(err, null);
					should.equal(err.field, 'height');
					should.equal(err.value, 4);
					should.equal(err.msg, 'out-of-range-number');
					should.equal(err.type, 'validation');
					should.equal(john.id, null);

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
					should.equal(err.field, 'name');
					should.equal(err.value, null);
					should.equal(err.msg, 'required');
					should.equal(err.type, 'validation');
					should.equal(john.id, null);

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
						field: 'name', value: 'n', msg: 'out-of-range-length'
					}));

					should.deepEqual(err[1], _.extend(new Error(),{
						field: 'height', value: '4', msg: 'out-of-range-number'
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
						field: 'name', value: null, msg: 'required'
					}));

					should.deepEqual(err[1], _.extend(new Error(),{
						field: 'name', value: null, msg: 'undefined'
					}));

					should.deepEqual(err[2], _.extend(new Error(),{
						field: 'height', value: '4', msg: 'out-of-range-number'
					}));

					should.equal(john.id, null);

					return done();
				});
			});
		});
	});
});
