var ORM    = require('../../');
var helper = require('../support/spec_helper');
var should = require('should');
var async  = require('async');
var _      = require('lodash');

describe("hasOne", function() {
	var db     = null;
	var Animal = null;

	var setup = function (opts) {
		return function (done) {
			db.settings.set('instance.cache', opts.cache);
			db.settings.set('instance.returnAllErrors', true);

		        Animal = db.define('animal', {
                          id        : {type : "integer", key:true},
			  name      : {type : "text",    size:"255"},
                          damId     : {type : "integer"},
                          sireId    : {type : "integer"}
			});

		        Animal.hasOne('sire', Animal, {field: 'sireId', autoFetch:opts.autoFetch});
		        Animal.hasOne('dam',  Animal, {field: 'damId',  autoFetch:opts.autoFetch});

		        helper.dropSync([Animal], function(err) {
                          if (err) return done(err);
                          Animal.create([{ id:1,   name: 'Bronson',  sireId:10, damId:20},

                                         { id:10,  name: 'McTavish', sireId:11, damId:12},
                                         { id:11, name:'Todd'},
                                         { id:12, name:'Jemima'},

                                         { id:20,  name: 'Suzy',    sireId:21,  damId:22},
                                         { id:21,  name:'Liam'},
                                         { id:22,  name:'Glencora'}
                                        ], done);
                        });
		};
	};

	before(function(done) {
	  helper.connect(function (connection) {
	    db = connection;
	    done();
	  });
	});

        [{cache:false, autoFetch:true},
         {cache:true, autoFetch:true}
        ].forEach(function(opts) {

	  describe("recursive hasOne() with " + (opts.cache ? "" : "out ") + "cache", function () {
	    before(setup(opts));

	    it("should get Bronson's sire & dam", function (done) {
	      Animal.find({name: "Bronson"}, function(err, animals) {
                should.not.exist(err);

                animals[0].name.should.equal("Bronson");

                // All of Bronson's Sire & Dam stuff should be present
                animals[0].sireId.should.equal(10);
                animals[0].damId.should.equal(20);

                animals[0].should.have.property("sire");
                animals[0].should.have.property("dam");

                animals[0].sire.name.should.equal("McTavish");
                animals[0].dam.name.should.equal("Suzy");

                // Bronson's GrandSire & GrandDam shouldn't be present
                animals[0].sire.should.not.have.property("sire");
                animals[0].sire.should.not.have.property("dam");

                animals[0].dam.should.not.have.property("sire");
                animals[0].dam.should.not.have.property("dam");

                // but Bronson's GrandSire & GrandDam ID's should be known
                animals[0].sire.sireId.should.equal(11);
                animals[0].sire.damId.should.equal(12);

                animals[0].dam.sireId.should.equal(21);
                animals[0].dam.damId.should.equal(22);

		return done();
	      });
	    });

	    it("should get McTavish's sire & dam", function (done) {
	      Animal.find({name: "McTavish"}, function(err, animals) {
                should.not.exist(err);

                animals[0].name.should.equal("McTavish");

                // All of McTavish's Sire & Dam stuff should be present (won't be with cache turned on)
                animals[0].sireId.should.equal(11);
                animals[0].damId.should.equal(12);

                animals[0].should.have.property("sire");
                animals[0].should.have.property("dam");

                animals[0].sire.name.should.equal("Todd");
                animals[0].dam.name.should.equal("Jemima");

		return done();
	      });
	    });

	    it("should get Suzy's sire & dam", function (done) {
	      Animal.find({name: "Suzy"}, function(err, animals) {
                should.not.exist(err);

                animals[0].name.should.equal("Suzy");

                // All of Suzy's Sire & Dam stuff should be present (won't be with cache turned on)
                animals[0].sireId.should.equal(21);
                animals[0].damId.should.equal(22);

                animals[0].should.have.property("sire")
                animals[0].should.have.property("dam");

                animals[0].sire.name.should.equal("Liam");
                animals[0].dam.name.should.equal("Glencora");

                Animal.get(20, function(err, Suzy) {
                  should.not.exist(err);

                  Suzy.name.should.equal("Suzy");
                  Suzy.sire.name.should.equal("Liam");
                  Suzy.dam.name.should.equal("Glencora");
                });
		return done();
	      });
	    });
	  });
        });
});
