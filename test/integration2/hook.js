var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var async    = require('async');
var ORM      = require('../../');

describe("Hook", function() {
	var db = null;
	var Person = null;
	var triggeredHooks = {};
	var getTimestamp; // Calling it 'getTime' causes strangeness.

	if (process.hrtime) {
		getTimestamp = function () { return parseFloat(process.hrtime().join('.')); };
	} else {
		getTimestamp = function () { return Date.now(); };
	}

	var checkHook = function (hook) {
		triggeredHooks[hook] = false;

		return function () {
			triggeredHooks[hook] = getTimestamp();
		};
	};

	var setup = function (hooks) {
		if (typeof hooks == "undefined") {
			hooks = {
				afterCreate      : checkHook("afterCreate"),
				beforeCreate     : checkHook("beforeCreate"),
				afterSave        : checkHook("afterSave"),
				beforeSave       : checkHook("beforeSave"),
				beforeValidation : checkHook("beforeValidation"),
				beforeRemove     : checkHook("beforeRemove"),
				afterRemove      : checkHook("afterRemove")
			};
		}

		return function (done) {
			Person = db.define("person", {
				name   : String
			}, {
				hooks  : hooks
			});

			Person.settings.set("instance.returnAllErrors", false);

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

	// there are a lot of timeouts in this suite and Travis or other test runners can
	// have hickups that could force this suite to timeout to the default value (2 secs)
	this.timeout(30000);

	describe("after Model creation", function () {
		before(setup({}));

		it("can be changed", function (done) {
			var triggered = false;

			Person.afterCreate(function () {
				triggered = true;
			});
			Person.create([{ name: "John Doe" }], function () {
				triggered.should.be.true;

				return done();
			});
		});

		it("can be removed", function (done) {
			var triggered = false;

			Person.afterCreate(function () {
				triggered = true;
			});
			Person.create([{ name: "John Doe" }], function () {
				triggered.should.be.true;

				triggered = false;

				Person.afterCreate(); // clears hook

				Person.create([{ name: "Jane Doe" }], function () {
					triggered.should.be.false;

					return done();
				});
			});
		});
	});

	describe("beforeCreate", function () {
		before(setup());

		it("should trigger before creating instance", function (done) {
			Person.create([{ name: "John Doe" }], function () {
				triggeredHooks.afterCreate.should.be.a("number");
				triggeredHooks.beforeCreate.should.be.a("number");
				triggeredHooks.beforeCreate.should.not.be.above(triggeredHooks.afterCreate);

				return done();
			});
		});

		describe("when setting properties", function () {
			before(setup({
				beforeCreate : function () {
					this.name = "Jane Doe";
				}
			}));

			it("should not be discarded", function (done) {
				Person.create([{ }], function (err, items) {
					should.equal(err, null);

					items.should.be.a("object");
					items.should.have.property("length", 1);
					items[0].name.should.equal("Jane Doe");

					return done();
				});
			});
		});

		describe("if hook method has 1 argument", function () {
			var beforeCreate = false;

			before(setup({
				beforeCreate : function (next) {
					setTimeout(function () {
						beforeCreate = true;

						return next();
					}.bind(this), 200);
				}
			}));

			it("should wait for hook to finish", function (done) {
				this.timeout(500);

				Person.create([{ name: "John Doe" }], function () {
					beforeCreate.should.be.true;

					return done();
				});
			});

			describe("if hook triggers error", function () {
				before(setup({
					beforeCreate : function (next) {
						setTimeout(function () {
							return next(new Error('beforeCreate-error'));
						}, 200);
					}
				}));

				it("should trigger error", function (done) {
					this.timeout(500);

					Person.create([{ name: "John Doe" }], function (err) {
						err.should.be.a("object");
						err.message.should.equal("beforeCreate-error");

						return done();
					});
				});
			});
		});
	});

	describe("afterCreate", function () {
		before(setup());

		it("should trigger after creating instance", function (done) {
			Person.create([{ name: "John Doe" }], function () {
				triggeredHooks.afterCreate.should.be.a("number");
				triggeredHooks.beforeCreate.should.be.a("number");
				triggeredHooks.afterCreate.should.not.be.below(triggeredHooks.beforeCreate);

				return done();
			});
		});
	});

	describe("beforeSave", function () {
		before(setup());

		it("should trigger before saving an instance", function (done) {
			Person.create([{ name: "John Doe" }], function () {
				triggeredHooks.afterSave.should.be.a("number");
				triggeredHooks.beforeSave.should.be.a("number");
				triggeredHooks.beforeSave.should.not.be.above(triggeredHooks.afterSave);

				return done();
			});
		});

		describe("if hook method has 1 argument", function () {
			var beforeSave = false;

			before(setup({
				beforeSave : function (next) {
					setTimeout(function () {
						beforeSave = true;

						return next();
					}.bind(this), 200);
				}
			}));

			it("should wait for hook to finish", function (done) {
				this.timeout(500);

				Person.create([{ name: "John Doe" }], function () {
					beforeSave.should.be.true;

					return done();
				});

			});

			describe("if hook triggers error", function () {
				before(setup({
					beforeSave : function (next) {
						if (this.name == "John Doe") {
							return next();
						}
						setTimeout(function () {
							return next(new Error('beforeSave-error'));
						}, 200);
					}
				}));

				it("should trigger error when creating", function (done) {
					this.timeout(500);

					Person.create([{ name: "Jane Doe" }], function (err) {
						err.should.be.a("object");
						err.message.should.equal("beforeSave-error");

						return done();
					});
				});

				it("should trigger error when saving", function (done) {
					this.timeout(500);

					Person.create([{ name: "John Doe" }], function (err, John) {
						should.equal(err, null);

						John[0].name = "Jane Doe";
						John[0].save(function (err) {
							err.should.be.a("object");
							err.message.should.equal("beforeSave-error");

							return done();
						});
					});
				});
			});
		});
	});

	describe("afterSave", function () {
		before(setup());

		it("should trigger after saving an instance", function (done) {
			Person.create([{ name: "John Doe" }], function () {
				triggeredHooks.afterSave.should.be.a("number");
				triggeredHooks.beforeSave.should.be.a("number");
				triggeredHooks.afterSave.should.not.be.below(triggeredHooks.beforeSave);

				return done();
			});
		});
	});

	describe("beforeValidation", function () {
		before(setup());

		it("should trigger before instance validation", function (done) {
			Person.create([{ name: "John Doe" }], function () {
				triggeredHooks.beforeValidation.should.be.a("number");
				triggeredHooks.beforeCreate.should.be.a("number");
				triggeredHooks.beforeSave.should.be.a("number");
				triggeredHooks.beforeValidation.should.not.be.above(triggeredHooks.beforeCreate);
				triggeredHooks.beforeValidation.should.not.be.above(triggeredHooks.beforeSave);

				return done();
			});
		});

		describe("if hook method has 1 argument", function () {
			var beforeValidation = false;
			this.timeout(500);

			before(setup({
				beforeValidation : function (next) {
					setTimeout(function () {
						beforeValidation = true;

						if (!this.name) return next("Name is missing");

						return next();
					}.bind(this), 200);
				}
			}));

			beforeEach(function () {
				beforeValidation = false;
			});

			it("should wait for hook to finish", function (done) {
				Person.create([{ name: "John Doe" }], function () {
					beforeValidation.should.be.true;

					return done();
				});
			});

			it("should trigger error if hook passes an error", function (done) {
				Person.create([{ name: "" }], function (err) {
					beforeValidation.should.be.true;

					err.should.equal("Name is missing");

					return done();
				});
			});

			it("should trigger when calling #validate", function (done) {
				var person = new Person();

				person.validate(function (err, validationErrors) {
					beforeValidation.should.be.true;

					return done();
				});
			});
		});
	});

	describe("afterLoad", function () {
		var afterLoad = false;

		before(setup({
			afterLoad: function () {
				afterLoad = true;
			}
		}));

		it("should trigger when defining a model", function (done) {
			var John = new Person({ name: "John" });

			afterLoad.should.be.true;

			return done();
		});

		describe("if hook method has 1 argument", function () {
			var afterLoad = false;

			before(setup({
				afterLoad : function (next) {
					setTimeout(function () {
						afterLoad = true;

						return next();
					}.bind(this), 200);
				}
			}));

			it("should wait for hook to finish", function (done) {
				this.timeout(500);

				Person.create([{ name: "John Doe" }], function (err, items) {
					afterLoad.should.be.true;

					return done();
				});
			});
		});
	});

	describe("afterAutoFetch", function () {
		var afterAutoFetch = false;

		before(setup({
			afterAutoFetch: function () {
				afterAutoFetch = true;
			}
		}));

		it("should trigger when defining a model", function (done) {
			var John = new Person({ name: "John" });

			afterAutoFetch.should.be.true;

			return done();
		});

		describe("if hook method has 1 argument", function () {
			var afterAutoFetch = false;

			before(setup({
				afterAutoFetch : function (next) {
					setTimeout(function () {
						afterAutoFetch = true;

						return next();
					}.bind(this), 200);
				}
			}));

			it("should wait for hook to finish", function (done) {
				this.timeout(500);

				Person.create([{ name: "John Doe" }], function (err, items) {
					afterAutoFetch.should.be.true;

					return done();
				});
			});
		});
	});

	describe("beforeRemove", function () {
		before(setup());

		it("should trigger before removing an instance", function (done) {
			Person.create([{ name: "John Doe" }], function (err, items) {
				items[0].remove(function () {
					triggeredHooks.afterRemove.should.be.a("number");
					triggeredHooks.beforeRemove.should.be.a("number");
					triggeredHooks.beforeRemove.should.not.be.above(triggeredHooks.afterRemove);

					return done();
				});
			});
		});

		describe("if hook method has 1 argument", function () {
			var beforeRemove = false;

			before(setup({
				beforeRemove : function (next) {
					setTimeout(function () {
						beforeRemove = true;

						return next();
					}.bind(this), 200);
				}
			}));

			it("should wait for hook to finish", function (done) {
				this.timeout(500);

				Person.create([{ name: "John Doe" }], function (err, items) {
					items[0].remove(function () {
						beforeRemove.should.be.true;

						return done();
					});
				});

			});

			describe("if hook triggers error", function () {
				before(setup({
					beforeRemove : function (next) {
						setTimeout(function () {
							return next(new Error('beforeRemove-error'));
						}, 200);
					}
				}));

				it("should trigger error", function (done) {
					this.timeout(500);

					Person.create([{ name: "John Doe" }], function (err, items) {
						items[0].remove(function (err) {
							err.should.be.a("object");
							err.message.should.equal("beforeRemove-error");

							return done();
						});
					});
				});
			});
		});
	});

	describe("afterRemove", function () {
		before(setup());

		it("should trigger after removing an instance", function (done) {
			Person.create([{ name: "John Doe" }], function (err, items) {
				items[0].remove(function () {
					triggeredHooks.afterRemove.should.be.a("number");
					triggeredHooks.beforeRemove.should.be.a("number");
					triggeredHooks.afterRemove.should.not.be.below(triggeredHooks.beforeRemove);

					return done();
				});
			});
		});
	});
});
