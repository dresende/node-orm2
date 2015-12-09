var ORM    = require('../../');
var helper = require('../support/spec_helper');
var should = require('should');
var async  = require('async');
var _      = require('lodash');

describe("hasOne", function() {
	var db     = null;
	var Animal = null;

	var setup = function (cache) {
		return function (done) {
			db.settings.set('instance.cache', cache);
			db.settings.set('instance.returnAllErrors', true);

		        Animal = db.define('animal', {
                          id        : {type : "integer", key:true},
			  name      : {type : "text",    size:"255"},
                          damId     : {type : "integer"},
                          sireId    : {type : "integer"}
			});

		        Animal.hasOne('sire', Animal, {field: 'sireId', autoFetch:true});
		        Animal.hasOne('dam',  Animal, {field: 'damId',  autoFetch:false});

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

        [false, 1].forEach(function(cache) {

	  describe("recursive hasOne() with " + (cache ? "" : "out ") + "cache", function () {
	    before(setup(cache));

	    it("should get Bronson's Sire but not Dam", function (done) {
	      Animal.find({name: "Bronson"}, function(err, animals) {
                should.not.exist(err);

                animals[0].name.should.equal("Bronson");

                // All of Bronson's Sire & some of his Dam stuff should be present
                animals[0].sireId.should.equal(10);
                animals[0].damId.should.equal(20);

                animals[0].should.have.property("sire");
                animals[0].should.not.have.property("dam");  // no auto-fetch

                animals[0].sire.name.should.equal("McTavish");

                // Bronson's paternal GrandSire & GrandDam shouldn't be present - autoFetchLimit
                animals[0].sire.should.not.have.property("sire");
                animals[0].sire.should.not.have.property("dam");

                // but Bronson's paternal GrandSire & GrandDam ID's should be known
                animals[0].sire.sireId.should.equal(11);
                animals[0].sire.damId.should.equal(12);

                return done();
	      });
	    });

	    it("should get McTavish's Sire but not Dam", function (done) {
	      Animal.find({name: "McTavish"}, function(err, animals) {
                should.not.exist(err);

                animals[0].name.should.equal("McTavish");

                // All of McTavish's Sire & some of his Dam stuff should be present
                animals[0].sireId.should.equal(11);
                animals[0].damId.should.equal(12);

                animals[0].should.have.property("sire");      // now fixed by stueynz
                animals[0].should.not.have.property("dam");   // no auto-fetch

                animals[0].sire.name.should.equal("Todd");    // just to be sure

                // Let's make sure the cache is still working...
                Animal.get(animals[0].id, function(err, McTavish) {
                  should.not.exist(err);

                  if(cache) {
                    McTavish.should.equal(animals[0]);
                  } else {
                    McTavish.should.not.equal(animals[0]);
                  }
		  return done();
                });
	      });
	    });

	    it("should get Suzy's Sire but not Dam", function (done) {
	      Animal.find({name: "Suzy"}, function(err, animals) {
                should.not.exist(err);

                animals[0].name.should.equal("Suzy");

                // All of Suzy's Sire & Dam stuff should be present
                animals[0].sireId.should.equal(21);
                animals[0].damId.should.equal(22);

                animals[0].should.have.property("sire")         // now fixed by stueynz
                animals[0].should.not.have.property("dam");     // no auto-fetch

                animals[0].sire.name.should.equal("Liam");      // just to be sure

                // Let's make sure the cache is still working...
                Animal.get(animals[0].id, function(err, Suzy) {
                  should.not.exist(err);

                  if(cache) {
                    Suzy.should.equal(animals[0]);
                  } else {
                    Suzy.should.not.equal(animals[0]);
                  }
		  return done();
                });
	      });
	    });
	  });
        });
});
