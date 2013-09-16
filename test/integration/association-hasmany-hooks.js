var should = require('should');
var helper = require('../support/spec_helper');
var ORM    = require('../../');

describe("hasMany hooks", function() {
	var db     = null;
	var Person = null;
	var Pet    = null;

	var setup = function (props, opts) {
		return function (done) {
			db.settings.set('instance.cache', false);

			Person = db.define('person', {
				name    : String,
			});
			Pet = db.define('pet', {
				name    : String
			});
			Person.hasMany('pets', Pet, props || {}, opts || {});

			return helper.dropSync([ Person, Pet ], done);
		};
	};

	before(function(done) {
		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

	describe("beforeSave", function () {
		var had_extra = false;

		before(setup({
			born : Date
		}, {
			hooks : {
				beforeSave: function (extra, next) {
					had_extra = (typeof extra == "object");
					return next();
				}
			}
		}));

		it("should pass extra data to hook if extra defined", function (done) {
			Person.create({
				name    : "John"
			}, function (err, John) {
				Pet.create({
					name : "Deco"
				}, function (err, Deco) {
					John.addPets(Deco, function (err) {
						should.not.exist(err);

						had_extra.should.be.true;

						return done();
					});
				});
			});
		});
	});

	describe("beforeSave", function () {
		var had_extra = false;

		before(setup({}, {
			hooks : {
				beforeSave: function (next) {
					next.should.be.a("function");
					return next();
				}
			}
		}));

		it("should not pass extra data to hook if extra defined", function (done) {
			Person.create({
				name    : "John"
			}, function (err, John) {
				Pet.create({
					name : "Deco"
				}, function (err, Deco) {
					John.addPets(Deco, function (err) {
						should.not.exist(err);

						return done();
					});
				});
			});
		});
	});

	describe("beforeSave", function () {
		var had_extra = false;

		before(setup({}, {
			hooks : {
				beforeSave: function (next) {
					setTimeout(function () {
						return next(new Error('blocked'));
					}, 100);
				}
			}
		}));

		it("should block if error returned", function (done) {
			Person.create({
				name    : "John"
			}, function (err, John) {
				Pet.create({
					name : "Deco"
				}, function (err, Deco) {
					John.addPets(Deco, function (err) {
						should.exist(err);
						err.message.should.equal('blocked');

						return done();
					});
				});
			});
		});
	});
});
