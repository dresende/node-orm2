var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');
var ORM      = require('../../');

describe("Model.save()", function() {
	var db = null;
	var Person = null;

	var setup = function (nameDefinition, opts) {
		opts = opts || {};

		return function (done) {
			Person = db.define("person", {
				name   : nameDefinition || String
			}, opts || {});

			Person.hasOne("parent", Person, opts.hasOneOpts);
			if ('saveAssociationsByDefault' in opts) {
				Person.settings.set(
					'instance.saveAssociationsByDefault', opts.saveAssociationsByDefault
				);
			}

			return helper.dropSync(Person, done);
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

	describe("if properties have default values", function () {
		before(setup({ type: "text", defaultValue: "John" }));

		it("should use it if not defined", function (done) {
			var John = new Person();

			John.save(function (err) {
				should.equal(err, null);
				John.name.should.equal("John");

				return done();
			});
		});
	});

	describe("with callback", function () {
		before(setup());

		it("should save item and return id", function (done) {
			var John = new Person({
				name: "John"
			});
			John.save(function (err) {
				should.equal(err, null);
				should.exist(John[Person.id]);

				Person.get(John[Person.id], function (err, JohnCopy) {
					should.equal(err, null);

					JohnCopy[Person.id].should.equal(John[Person.id]);
					JohnCopy.name.should.equal(John.name);

					return done();
				});
			});
		});
	});

	describe("without callback", function () {
		before(setup());

		it("should still save item and return id", function (done) {
			var John = new Person({
				name: "John"
			});
			John.save();
			John.on("save", function (err) {
				should.equal(err, null);
				should.exist(John[Person.id]);

				Person.get(John[Person.id], function (err, JohnCopy) {
					should.equal(err, null);

					JohnCopy[Person.id].should.equal(John[Person.id]);
					JohnCopy.name.should.equal(John.name);

					return done();
				});
			});
		});
	});

	describe("with properties object", function () {
		before(setup());

		it("should update properties, save item and return id", function (done) {
			var John = new Person({
				name: "Jane"
			});
			John.save({ name: "John" }, function (err) {
				should.equal(err, null);
				should.exist(John[Person.id]);
				John.name.should.equal("John");

				Person.get(John[Person.id], function (err, JohnCopy) {
					should.equal(err, null);

					JohnCopy[Person.id].should.equal(John[Person.id]);
					JohnCopy.name.should.equal(John.name);

					return done();
				});
			});
		});
	});

	describe("with unknown argument type", function () {
		before(setup());

		it("should should throw", function (done) {
			var John = new Person({
				name: "Jane"
			});
			(function () {
				John.save("will-fail");
			}).should.throw();

			return done();
		});
	});

	describe("if passed an association instance", function () {
		before(setup());

		it("should save association first and then save item and return id", function (done) {
			var Jane = new Person({
				name  : "Jane"
			});
			var John = new Person({
				name  : "John",
				parent: Jane
			});
			John.save(function (err) {
				should.equal(err, null);
				John.saved().should.be.true;
				Jane.saved().should.be.true;

				should.exist(John[Person.id]);
				should.exist(Jane[Person.id]);

				return done();
			});
		});
	});

	describe("if passed an association object", function () {
		before(setup());

		it("should save association first and then save item and return id", function (done) {
			var John = new Person({
				name  : "John",
				parent: {
					name  : "Jane"
				}
			});
			John.save(function (err) {
				should.equal(err, null);
				John.saved().should.be.true;
				John.parent.saved().should.be.true;

				should.exist(John[Person.id]);
				should.exist(John.parent[Person.id]);
				should.equal(John.parent.name, "Jane");

				return done();
			});
		});
	});

	describe("if autoSave is on", function () {
		before(setup(null, { autoSave: true }));

		it("should save the instance as soon as a property is changed", function (done) {
			var John = new Person({
				name : "Jhon"
			});
			John.save(function (err) {
				should.equal(err, null);

				John.on("save", function () {
					return done();
				});

				John.name = "John";
			});
		});
	});

	describe("with saveAssociations", function () {
		var afterSaveCalled = false;

		if (common.protocol() == 'mongodb') return;

		describe("default on in settings", function () {
			beforeEach(function (done) {
				function afterSave () {
					afterSaveCalled = true;
				}
				var hooks = { afterSave: afterSave };

				setup(null, { hooks: hooks, cache: false, hasOneOpts: { autoFetch: true } })(function (err) {
					should.not.exist(err);

					Person.create({ name: 'Olga' }, function (err, olga) {
						should.not.exist(err);

						should.exist(olga);
						Person.create({ name: 'Hagar', parent_id: olga.id }, function (err, hagar) {
							should.not.exist(err);
							should.exist(hagar);
							afterSaveCalled = false;
							done();
						});
					});
				});
			});

			it("should be on", function () {
				should.equal(Person.settings.get('instance.saveAssociationsByDefault'), true);
			});

			it("off should not save associations but save itself", function (done) {
				Person.one({ name: 'Hagar' }, function (err, hagar) {
					should.not.exist(err);
					should.exist(hagar.parent);

					hagar.parent.name = 'Olga2';
					hagar.save({name: 'Hagar2'}, { saveAssociations: false }, function (err) {
						should.not.exist(err);
						should.equal(afterSaveCalled, true);

						Person.get(hagar.parent.id, function (err, olga) {
							should.not.exist(err);
							should.equal(olga.name, 'Olga');
							done();
						});
					});
				});
			});

			it("off should not save associations or itself if there are no changes", function (done) {
				Person.one({ name: 'Hagar' }, function (err, hagar) {
					should.not.exist(err);

					hagar.save({}, { saveAssociations: false }, function (err) {
						should.not.exist(err);
						should.equal(afterSaveCalled, false);

						Person.get(hagar.parent.id, function (err, olga) {
							should.not.exist(err);
							should.equal(olga.name, 'Olga');
							done();
						});
					});
				});
			});

			it("unspecified should save associations and itself", function (done) {
				Person.one({ name: 'Hagar' }, function (err, hagar) {
					should.not.exist(err);
					should.exist(hagar.parent);

					hagar.parent.name = 'Olga2';
					hagar.save({name: 'Hagar2'}, function (err) {
						should.not.exist(err);

						Person.get(hagar.parent.id, function (err, olga) {
							should.not.exist(err);
							should.equal(olga.name, 'Olga2');

							Person.get(hagar.id, function (err, person) {
								should.not.exist(err);
								should.equal(person.name, 'Hagar2');

								done();
							});
						});
					});
				});
			});

			it("on should save associations and itself", function (done) {
				Person.one({ name: 'Hagar' }, function (err, hagar) {
					should.not.exist(err);
					should.exist(hagar.parent);

					hagar.parent.name = 'Olga2';
					hagar.save({name: 'Hagar2'}, { saveAssociations: true }, function (err) {
						should.not.exist(err);

						Person.get(hagar.parent.id, function (err, olga) {
							should.not.exist(err);
							should.equal(olga.name, 'Olga2');

							Person.get(hagar.id, function (err, person) {
								should.not.exist(err);
								should.equal(person.name, 'Hagar2');

								done();
							});
						});
					});
				});
			});
		});

		describe("turned off in settings", function () {
			beforeEach(function (done) {
				function afterSave () {
					afterSaveCalled = true;
				}
				var hooks = { afterSave: afterSave };

				setup(null, {
					hooks: hooks, cache: false, hasOneOpts: { autoFetch: true },
					saveAssociationsByDefault: false
				})(function (err) {
					should.not.exist(err);

					Person.create({ name: 'Olga' }, function (err, olga) {
						should.not.exist(err);

						should.exist(olga);
						Person.create({ name: 'Hagar', parent_id: olga.id }, function (err, hagar) {
							should.not.exist(err);
							should.exist(hagar);
							afterSaveCalled = false;
							done();
						});
					});
				});
			});

			it("should be off", function () {
				should.equal(Person.settings.get('instance.saveAssociationsByDefault'), false);
			});

			it("unspecified should not save associations but save itself", function (done) {
				Person.one({ name: 'Hagar' }, function (err, hagar) {
					should.not.exist(err);
					should.exist(hagar.parent);

					hagar.parent.name = 'Olga2';
					hagar.save({ name: 'Hagar2' }, function (err) {
						should.not.exist(err);

						Person.get(hagar.parent.id, function (err, olga) {
							should.not.exist(err);
							should.equal(olga.name, 'Olga');

							Person.get(hagar.id, function (err, person) {
								should.not.exist(err);
								should.equal(person.name, 'Hagar2');

								done();
							});
						});
					});
				});
			});

			it("off should not save associations but save itself", function (done) {
				Person.one({ name: 'Hagar' }, function (err, hagar) {
					should.not.exist(err);
					should.exist(hagar.parent);

					hagar.parent.name = 'Olga2';
					hagar.save({ name: 'Hagar2' }, { saveAssociations: false }, function (err) {
						should.not.exist(err);
						should.equal(afterSaveCalled, true);

						Person.get(hagar.parent.id, function (err, olga) {
							should.not.exist(err);
							should.equal(olga.name, 'Olga');
							done();
						});
					});
				});
			});

			it("on should save associations and itself", function (done) {
				Person.one({ name: 'Hagar' }, function (err, hagar) {
					should.not.exist(err);
					should.exist(hagar.parent);

					hagar.parent.name = 'Olga2';
					hagar.save({ name: 'Hagar2' }, { saveAssociations: true }, function (err) {
						should.not.exist(err);

						Person.get(hagar.parent.id, function (err, olga) {
							should.not.exist(err);
							should.equal(olga.name, 'Olga2');

							Person.get(hagar.id, function (err, person) {
								should.not.exist(err);
								should.equal(person.name, 'Hagar2');

								done();
							});
						});
					});
				});
			});
		});
	});

	describe("with a point property", function () {
		if (common.protocol() == 'sqlite' || common.protocol() == 'mongodb') return;

		it("should save the instance as a geospatial point", function (done) {
			setup({ type: "point" }, null)(function () {
				var John = new Person({
					name: { x: 51.5177, y: -0.0968 }
				});
				John.save(function (err) {
					should.equal(err, null);

					John.name.should.be.an.instanceOf(Object);
					John.name.should.have.property('x', 51.5177);
					John.name.should.have.property('y', -0.0968);
					return done();
				});
			});
		});
	});

	describe("mockable", function() {
		before(setup());

		it("save should be writable", function(done) {
			var John = new Person({
				name: "John"
			});
			var saveCalled = false;
			John.save = function(cb) {
				saveCalled = true;
				cb(null);
			};
			John.save(function(err) {
				should.equal(saveCalled,true);
				return done();
			});
		});

		it("saved should be writable", function(done) {
			var John = new Person({
				name: "John"
			});
			var savedCalled = false;
			John.saved = function() {
				savedCalled = true;
				return true;
			};

			John.saved()
			savedCalled.should.be.true;
			done();
		})
	});
});
