var should = require('should');
var helper = require('../support/spec_helper');
var ORM    = require('../../');

describe("hasMany extra properties", function() {
	var db     = null;
	var Person = null;
	var Pet    = null;

	var data = { adopted: true };
	var since14 = new Date("2014-01-01");
	var since15 = new Date("1915-04-25");

	var setup = function (opts) {
		opts = opts || {};
		return function (done) {

			Person = db.define('person', {
				name    : String
			}, opts);
			Pet = db.define('pet', {
				name    : String
			}, opts);
			Person.hasMany('pets', Pet, {
				since   : Date,
				data    : Object
			});

			return helper.dropSync([ Person, Pet ], function(err) {
                if (err) return done(err);
				Person.create([{name	: "John"},
							   {name	: "Jane"}], function (err, people) {

	                if (err) return done(err);
					Pet.create([{name : "Deco"},
								{name : "Mutt"}], function (err, pets) {

		                if (err) return done(err);
						people[0].addPets(pets, { since : since14, data: data }, function (err) {
							people[1].addPets(pets, { since : since15, data: data }, done);
						});
					});
				});
			});
        };
    };

	before(function(done) {
		this.timeout(4000);

		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

  [true, false].forEach(function(cache) {
	describe("if passed to addAccessor", function () {
		before(setup( {cache:cache}));

		it("should be added to association and correctly retrieved " + (cache ? "with" : "without") + " the cache", function (done) {
		  Person.find({ name: "John" }, { autoFetch : true }).first(function (err, John) {
			should.equal(err, null);

			John.should.have.property("pets");
			should(Array.isArray(John.pets));

			John.pets.length.should.equal(2);

			John.pets[0].should.have.property("name");
			John.pets[0].should.have.property("extra");
			John.pets[0].extra.should.be.a("object");
			John.pets[0].extra.should.have.property("since");
			should(John.pets[0].extra.since instanceof Date);
            should.equal(John.pets[0].extra.since.getFullYear(), since14.getFullYear());

			should.equal(typeof John.pets[0].extra.data, 'object');
			should.equal(JSON.stringify(data), JSON.stringify(John.pets[0].extra.data));

			// Do a second retrieve (which will break the cache)
			Person.find({name: "Jane"}, {autoFetch:true}).first(function(err, Jane) {
			  should.equal(err, null);

			  Jane.pets[0].should.have.property("name");
			  Jane.pets[0].should.have.property("extra");
			  Jane.pets[0].extra.should.be.a("object");
			  Jane.pets[0].extra.should.have.property("since");
			  should(Jane.pets[0].extra.since instanceof Date);
			  should.equal(Jane.pets[0].extra.since.getFullYear(), since15.getFullYear());

			  return done();
            })
		  });
        });
    });
  });
});
