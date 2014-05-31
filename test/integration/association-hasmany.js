var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');
var common   = require('../common');
var protocol = common.protocol();

describe("hasMany", function () {
	this.timeout(4000);
	var db     = null;
	var Person = null;
	var Pet    = null;

	before(function(done) {
		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

	describe("normal", function () {

		var setup = function (opts) {
			opts = opts || {};

			return function (done) {
				db.settings.set('instance.cache', false);

				Person = db.define('person', {
					name    : String,
					surname : String,
					age     : Number
				});
				Pet = db.define('pet', {
					name    : String
				});
				Person.hasMany('pets', Pet, {}, { autoFetch: opts.autoFetchPets });

				helper.dropSync([ Person, Pet ], function (err) {
					if (err) return done(err);
					/**
					 * John --+---> Deco
					 *        '---> Mutt <----- Jane
					 *
					 * Justin
					 */
					Person.create([{
						name    : "John",
						surname : "Doe",
						age     : 20,
						pets    : [{
							name    : "Deco"
						}, {
							name    : "Mutt"
						}]
					}, {
						name    : "Jane",
						surname : "Doe",
						age     : 16
					}, {
						name    : "Justin",
						surname : "Dean",
						age     : 18
					}], function (err) {
						Person.find({ name: "Jane" }, function (err, people) {
							Pet.find({ name: "Mutt" }, function (err, pets) {
								people[0].addPets(pets, done);
							});
						});
					});
				});
			};
		};

		describe("getAccessor", function () {
			before(setup());

			it("should allow to specify order as string", function (done) {
				Person.find({ name: "John" }, function (err, people) {
					should.equal(err, null);

					people[0].getPets("-name", function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(2);
						pets[0].name.should.equal("Mutt");
						pets[1].name.should.equal("Deco");

						return done();
					});
				});
			});

			it("should allow to specify order as Array", function (done) {
				Person.find({ name: "John" }, function (err, people) {
					should.equal(err, null);

					people[0].getPets([ "name", "Z" ], function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(2);
						pets[0].name.should.equal("Mutt");
						pets[1].name.should.equal("Deco");

						return done();
					});
				});
			});

			it("should allow to specify a limit", function (done) {
				Person.find({ name: "John" }).first(function (err, John) {
					should.equal(err, null);

					John.getPets(1, function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(1);

						return done();
					});
				});
			});

			it("should allow to specify conditions", function (done) {
				Person.find({ name: "John" }).first(function (err, John) {
					should.equal(err, null);

					John.getPets({ name: "Mutt" }, function (err, pets) {
						should.equal(err, null);

						should(Array.isArray(pets));
						pets.length.should.equal(1);
						pets[0].name.should.equal("Mutt");

						return done();
					});
				});
			});

			if (common.protocol() == "mongodb") return;

			it("should return a chain if no callback defined", function (done) {
				Person.find({ name: "John" }, function (err, people) {
					should.equal(err, null);

					var chain = people[0].getPets({ name: "Mutt" });

					chain.should.be.a("object");
					chain.find.should.be.a("function");
					chain.only.should.be.a("function");
					chain.limit.should.be.a("function");
					chain.order.should.be.a("function");

					return done();
				});
			});

			it("should allow chaining count()", function (done) {
				Person.find({}, function (err, people) {
					should.equal(err, null);

					people[0].getPets().count(function (err, count) {
						should.not.exist(err);

						should.strictEqual(count, 2);

						people[1].getPets().count(function (err, count) {
							should.not.exist(err);

							should.strictEqual(count, 1);

							people[2].getPets().count(function (err, count) {
								should.not.exist(err);

								should.strictEqual(count, 0);

								return done();
							});
						});
					});
				});
			});
		});

		describe("hasAccessor", function () {
			before(setup());

			it("should return true if instance has associated item", function (done) {
				Pet.find({ name: "Mutt" }, function (err, pets) {
					should.equal(err, null);

					Person.find({ name: "Jane" }).first(function (err, Jane) {
						should.equal(err, null);

						Jane.hasPets(pets[0], function (err, has_pets) {
							should.equal(err, null);
							has_pets.should.be.true;

							return done();
						});
					});
				});
			});

			it("should return true if not passing any instance and has associated items", function (done) {
				Person.find({ name: "Jane" }).first(function (err, Jane) {
					should.equal(err, null);

					Jane.hasPets(function (err, has_pets) {
						should.equal(err, null);
						has_pets.should.be.true;

						return done();
					});
				});
			});

			it("should return true if all passed instances are associated", function (done) {
				Pet.find(function (err, pets) {
					Person.find({ name: "John" }).first(function (err, John) {
						should.equal(err, null);

						John.hasPets(pets, function (err, has_pets) {
							should.equal(err, null);
							has_pets.should.be.true;

							return done();
						});
					});
				});
			});

			it("should return false if any passed instances are not associated", function (done) {
				Pet.find(function (err, pets) {
					Person.find({ name: "Jane" }).first(function (err, Jane) {
						should.equal(err, null);

						Jane.hasPets(pets, function (err, has_pets) {
							should.equal(err, null);
							has_pets.should.be.false;

							return done();
						});
					});
				});
			});
		});

		describe("delAccessor", function () {
			before(setup());

			it("should accept arguments in different orders", function (done) {
				Pet.find({ name: "Mutt" }, function (err, pets) {
					Person.find({ name: "John" }, function (err, people) {
						should.equal(err, null);

						people[0].removePets(function (err) {
							should.equal(err, null);

							people[0].getPets(function (err, pets) {
								should.equal(err, null);

								should(Array.isArray(pets));
								pets.length.should.equal(1);
								pets[0].name.should.equal("Deco");

								return done();
							});
						}, pets[0]);
					});
				});
			});
		});

		describe("delAccessor", function () {
			before(setup());

			it("should remove specific associations if passed", function (done) {
				Pet.find({ name: "Mutt" }, function (err, pets) {
					Person.find({ name: "John" }, function (err, people) {
						should.equal(err, null);

						people[0].removePets(pets[0], function (err) {
							should.equal(err, null);

							people[0].getPets(function (err, pets) {
								should.equal(err, null);

								should(Array.isArray(pets));
								pets.length.should.equal(1);
								pets[0].name.should.equal("Deco");

								return done();
							});
						});
					});
				});
			});

			it("should remove all associations if none passed", function (done) {
				Person.find({ name: "John" }).first(function (err, John) {
					should.equal(err, null);

					John.removePets(function (err) {
						should.equal(err, null);

						John.getPets(function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(0);

							return done();
						});
					});
				});
			});
		});

		describe("addAccessor", function () {
			before(setup());

			if (common.protocol() != "mongodb") {
				it("might add duplicates", function (done) {
					Pet.find({ name: "Mutt" }, function (err, pets) {
						Person.find({ name: "Jane" }, function (err, people) {
							should.equal(err, null);

							people[0].addPets(pets[0], function (err) {
								should.equal(err, null);

								people[0].getPets("name", function (err, pets) {
									should.equal(err, null);

									should(Array.isArray(pets));
									pets.length.should.equal(2);
									pets[0].name.should.equal("Mutt");
									pets[1].name.should.equal("Mutt");

									return done();
								});
							});
						});
					});
				});
			}

			it("should keep associations and add new ones", function (done) {
				Pet.find({ name: "Deco" }).first(function (err, Deco) {
					Person.find({ name: "Jane" }).first(function (err, Jane) {
						should.equal(err, null);

						Jane.getPets(function (err, janesPets) {
							should.not.exist(err);

							var petsAtStart = janesPets.length;

							Jane.addPets(Deco, function (err) {
								should.equal(err, null);

								Jane.getPets("name", function (err, pets) {
									should.equal(err, null);

									should(Array.isArray(pets));
									pets.length.should.equal(petsAtStart + 1);
									pets[0].name.should.equal("Deco");
									pets[1].name.should.equal("Mutt");

									return done();
								});
							});
						});
					});
				});
			});

			it("should accept several arguments as associations", function (done) {
				Pet.find(function (err, pets) {
					Person.find({ name: "Justin" }).first(function (err, Justin) {
						should.equal(err, null);

						Justin.addPets(pets[0], pets[1], function (err) {
							should.equal(err, null);

							Justin.getPets(function (err, pets) {
								should.equal(err, null);

								should(Array.isArray(pets));
								pets.length.should.equal(2);

								return done();
							});
						});
					});
				});
			});

			it("should accept array as list of associations", function (done) {
				Pet.create([{ name: 'Ruff' }, { name: 'Spotty' }],function (err, pets) {
					Person.find({ name: "Justin" }).first(function (err, Justin) {
						should.equal(err, null);

						Justin.getPets(function (err, justinsPets) {
							should.equal(err, null);

							var petCount = justinsPets.length;

							Justin.addPets(pets, function (err) {
								should.equal(err, null);

								Justin.getPets(function (err, justinsPets) {
									should.equal(err, null);

									should(Array.isArray(justinsPets));
									// Mongo doesn't like adding duplicates here, so we add new ones.
									should.equal(justinsPets.length, petCount + 2);

									return done();
								});
							});
						});
					});
				});
			});

			it("should throw if no items passed", function (done) {
				Person.one(function (err, person) {
					should.equal(err, null);

					(function () {
						person.addPets(function () {});
					}).should.throw();

					return done();
				});
			});
		});

		describe("setAccessor", function () {
			before(setup());

			it("should accept several arguments as associations", function (done) {
				Pet.find(function (err, pets) {
					Person.find({ name: "Justin" }).first(function (err, Justin) {
						should.equal(err, null);

						Justin.setPets(pets[0], pets[1], function (err) {
							should.equal(err, null);

							Justin.getPets(function (err, pets) {
								should.equal(err, null);

								should(Array.isArray(pets));
								pets.length.should.equal(2);

								return done();
							});
						});
					});
				});
			});

			it("should accept an array of associations", function (done) {
				Pet.find(function (err, pets) {
					Person.find({ name: "Justin" }).first(function (err, Justin) {
						should.equal(err, null);

						Justin.setPets(pets, function (err) {
							should.equal(err, null);

							Justin.getPets(function (err, all_pets) {
								should.equal(err, null);

								should(Array.isArray(all_pets));
								all_pets.length.should.equal(pets.length);

								return done();
							});
						});
					});
				});
			});

			it("should remove all associations if an empty array is passed", function (done) {
				Person.find({ name: "Justin" }).first(function (err, Justin) {
					should.equal(err, null);
					Justin.getPets(function (err, pets) {
						should.equal(err, null);
						should.equal(pets.length, 2);

						Justin.setPets([], function (err) {
							should.equal(err, null);

							Justin.getPets(function (err, pets) {
								should.equal(err, null);
								should.equal(pets.length, 0);

								return done();
							});
						});
					});
				});
			});

			it("clears current associations", function (done) {
				Pet.find({ name: "Deco" }, function (err, pets) {
					var Deco = pets[0];

					Person.find({ name: "Jane" }).first(function (err, Jane) {
						should.equal(err, null);

						Jane.getPets(function (err, pets) {
							should.equal(err, null);

							should(Array.isArray(pets));
							pets.length.should.equal(1);
							pets[0].name.should.equal("Mutt");

							Jane.setPets(Deco, function (err) {
								should.equal(err, null);

								Jane.getPets(function (err, pets) {
									should.equal(err, null);

									should(Array.isArray(pets));
									pets.length.should.equal(1);
									pets[0].name.should.equal(Deco.name);

									return done();
								});
							});
						});
					});
				});
			});
		});

		describe("with autoFetch turned on", function () {
			before(setup({
				autoFetchPets : true
			}));

			it("should fetch associations", function (done) {
				Person.find({ name: "John" }).first(function (err, John) {
					should.equal(err, null);

					John.should.have.property("pets");
					should(Array.isArray(John.pets));
					John.pets.length.should.equal(2);

					return done();
				});
			});

			it("should save existing", function (done) {
				Person.create({ name: 'Bishan' }, function (err) {
					should.not.exist(err);

					Person.one({ name: 'Bishan' }, function (err, person) {
						should.not.exist(err);

						person.surname = 'Dominar';

						person.save(function (err) {
							should.not.exist(err);

							done();
						});
					});
				});
			});

			it("should not auto save associations which were autofetched", function (done) {
				Pet.all(function (err, pets) {
					should.not.exist(err);
					should.equal(pets.length, 2);

					Person.create({ name: 'Paul' }, function (err, paul) {
						should.not.exist(err);

						Person.one({ name: 'Paul' }, function (err, paul2) {
							should.not.exist(err);
							should.equal(paul2.pets.length, 0);

							paul.setPets(pets, function (err) {
								should.not.exist(err);

								// reload paul to make sure we have 2 pets
								Person.one({ name: 'Paul' }, function (err, paul) {
									should.not.exist(err);
									should.equal(paul.pets.length, 2);

									// Saving paul2 should NOT auto save associations and hence delete
									// the associations we just created.
									paul2.save(function (err) {
										should.not.exist(err);

										// let's check paul - pets should still be associated
										Person.one({ name: 'Paul' }, function (err, paul) {
											should.not.exist(err);
											should.equal(paul.pets.length, 2);

											done();
										});
									});
								});
							});
						});
					});
				});
			});

			it("should save associations set by the user", function (done) {
				Person.one({ name: 'John' }, function (err, john) {
					should.not.exist(err);
					should.equal(john.pets.length, 2);

					john.pets = [];

					john.save(function (err) {
						should.not.exist(err);

						// reload john to make sure pets were deleted
						Person.one({ name: 'John' }, function (err, john) {
							should.not.exist(err);
							should.equal(john.pets.length, 0);

							done();
						});
					});
				});
			});

		});
	});

	if (protocol == "mongodb") return;

	describe("with non-standard keys", function () {
		var Email;
		var Account;

		setup = function (opts, done) {
			Email = db.define('email', {
			  text         : { type: 'text', key: true, required: true },
			  bounced      : Boolean
			});

			Account = db.define('account', {
			  name: String
			});

			Account.hasMany('emails', Email, {}, { key: opts.key });

			helper.dropSync([ Email, Account ], function (err) {
				if (err) return done(err);
				done()
			});
		};

		it("should place ids in the right place", function (done) {
			setup({}, function (err) {
				should.not.exist(err);

				Email.create([{bounced: true, text: 'a@test.com'}, {bounced: false, text: 'z@test.com'}], function (err, emails) {
					should.not.exist(err);

					Account.create({ name: "Stuff" }, function (err, account) {
						should.not.exist(err);

						account.addEmails(emails[1], function (err) {
							should.not.exist(err);

							db.driver.execQuery("SELECT * FROM account_emails", function (err, data) {
								should.not.exist(err);

								should.equal(data[0].account_id, 1);
								should.equal(data[0].emails_text, 'z@test.com');

								done();
							});
						});
					});
				});
			});
		});

		it("should generate correct tables", function (done) {
			setup({}, function (err) {
				should.not.exist(err);

				var sql;

				if (protocol == 'sqlite') {
					sql = "PRAGMA table_info(?)";
				} else {
					sql = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY data_type";
				}

				db.driver.execQuery(sql, ['account_emails'], function (err, cols) {
					should.not.exist(err);

					if (protocol == 'sqlite') {
						should.equal(cols[0].name, 'account_id');
						should.equal(cols[0].type, 'INTEGER');
						should.equal(cols[1].name, 'emails_text');
						should.equal(cols[1].type, 'TEXT');
					} else if (protocol == 'mysql') {
						should.equal(cols[0].column_name, 'account_id');
						should.equal(cols[0].data_type,   'int');
						should.equal(cols[1].column_name, 'emails_text');
						should.equal(cols[1].data_type,    'varchar');
					} else if (protocol == 'postgres') {
						should.equal(cols[0].column_name, 'account_id');
						should.equal(cols[0].data_type,   'integer');
						should.equal(cols[1].column_name, 'emails_text');
						should.equal(cols[1].data_type,   'text');
					}

					done();
				});
			});
		});

		it("should add a composite key to the join table if requested", function (done) {
			setup({ key: true }, function (err) {
				should.not.exist(err);
				var sql;

				if (protocol == 'postgres' || protocol === 'redshift') {
					sql = "" +
						"SELECT c.column_name, c.data_type " +
						"FROM  information_schema.table_constraints tc " +
						"JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name) " +
						"JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema AND tc.table_name = c.table_name AND ccu.column_name = c.column_name " +
						"WHERE constraint_type = ? AND tc.table_name = ? " +
						"ORDER BY column_name";

					db.driver.execQuery(sql, ['PRIMARY KEY', 'account_emails'], function (err, data) {
						should.not.exist(err);

						should.equal(data.length, 2);
						should.equal(data[0].column_name, 'account_id');
						should.equal(data[1].column_name, 'emails_text');

						done()
					});
				} else if (protocol == 'mysql') {
					db.driver.execQuery("SHOW KEYS FROM ?? WHERE Key_name = ?", ['account_emails', 'PRIMARY'], function (err, data) {
						should.not.exist(err);

						should.equal(data.length, 2);
						should.equal(data[0].Column_name, 'account_id');
						should.equal(data[0].Key_name, 'PRIMARY');
						should.equal(data[1].Column_name, 'emails_text');
						should.equal(data[1].Key_name, 'PRIMARY');

						done();
					});
				} else if (protocol == 'sqlite') {
					db.driver.execQuery("pragma table_info(??)", ['account_emails'], function (err, data) {
						should.not.exist(err);

						should.equal(data.length, 2);
						should.equal(data[0].name, 'account_id');
						should.equal(data[0].pk, 1);
						should.equal(data[1].name, 'emails_text');
						should.equal(data[1].pk, 1);

						done();
					});
				}
			});
		});
	});
});
