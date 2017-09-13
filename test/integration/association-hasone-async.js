var ORM      = require('../../');
var helper   = require('../support/spec_helper');
var should   = require('should');
var async    = require('async');
var _        = require('lodash');
var common   = require('../common');
var protocol = common.protocol();

describe("hasOne", function() {
  var db    = null;
  var Tree  = null;
  var Stalk = null;
  var Leaf  = null;
  var leafId = null;
  var treeId = null;
  var stalkId = null;
  var holeId  = null;

  var setup = function (opts) {
    opts = opts || {};
    return function (done) {
      db.settings.set('instance.identityCache', false);
      db.settings.set('instance.returnAllErrors', true);
      Tree  = db.define("tree",   { type:   { type: 'text'    } });
      Stalk = db.define("stalk",  { length: { type: 'integer' } });
      Hole  = db.define("hole",   { width:  { type: 'integer' } });
      Leaf  = db.define("leaf", {
        size:   { type: 'integer' },
        holeId: { type: 'integer', mapsTo: 'hole_id' }
      }, {
        validations: opts.validations
      });
      Leaf.hasOne('tree',  Tree,  { field: 'treeId', autoFetch: !!opts.autoFetch });
      Leaf.hasOne('stalk', Stalk, { field: 'stalkId', mapsTo: 'stalk_id' });
      Leaf.hasOne('hole',  Hole,  { field: 'holeId' });

      return helper.dropSync([Tree, Stalk, Hole, Leaf], function() {
        Tree.create({ type: 'pine' }, function (err, tree) {
          should.not.exist(err);
          treeId = tree[Tree.id];
          Leaf.create({ size: 14 }, function (err, leaf) {
            should.not.exist(err);
            leafId = leaf[Leaf.id];
            leaf.setTree(tree, function (err) {
              should.not.exist(err);
              Stalk.create({ length: 20 }, function (err, stalk) {
                should.not.exist(err);
                should.exist(stalk);
                stalkId = stalk[Stalk.id];
                Hole.create({ width: 3 }, function (err, hole) {
                  should.not.exist(err);
                  holeId = hole.id;
                  done();
                });
              });
            });
          });
        });
      });
    };
  };

  before(function(done) {
    helper.connect(function (connection) {
      db = connection;
      done();
    });
  });

  describe("accessors Async", function () {
    before(setup());

    it("get should get the association", function () {
      return Leaf
        .oneAsync({ size: 14 })
        .then(function(leaf) {
					should.exist(leaf);
          return leaf.getTreeAsync();
        })
        .then(function (tree) {
          should.exist(tree);
        });
    });

    it("should return proper instance model", function () {
      return Leaf
        .oneAsync({ size: 14 })
        .then(function (leaf) {
          return leaf.getTreeAsync();
        })
        .then(function (tree) {
          tree.model().should.equal(Tree);
        });
    });

    it("get should get the association with a shell model", function () {
      return Leaf(leafId)
        .getTreeAsync()
        .then(function (tree) {
          should.exist(tree);
          should.equal(tree[Tree.id], treeId);
        });
    });

    it("has should indicate if there is an association present", function () {
      return Leaf.oneAsync({ size: 14 })
        .then(function (leaf) {
          should.exist(leaf);
          return [leaf, leaf.hasTreeAsync()];
        })
        .spread(function (leaf, has) {
          should.equal(has, true);
          return leaf.hasStalkAsync();
				})
        .then(function (has) {
          should.equal(has, false);
        });
    });

    it("set should associate another instance", function () {
      return Stalk
        .oneAsync({ length: 20 })
        .then(function (stalk) {
          should.exist(stalk);
          return [stalk, Leaf.oneAsync({ size: 14 })];
        })
        .spread(function (stalk, leaf) {
          should.exist(leaf);
          should.not.exist(leaf.stalkId);
					return [stalk, leaf.setStalkAsync(stalk)];
				})
        .then(function (stalk) {
          return [stalk, Leaf.oneAsync({ size: 14 })];
        })
        .spread(function (stalk, leafOne) {
          should.equal(leafOne.stalkId, stalk[0][Stalk.id]);
        });
    });

    it("remove should unassociation another instance", function () {
      return Stalk
        .oneAsync({ length: 20 })
        .then(function (stalk) {
          should.exist(stalk);
					return Leaf.oneAsync({ size: 14 });
				})
        .then(function (leaf) {
          should.exist(leaf);
          should.exist(leaf.stalkId);
          return leaf.removeStalkAsync();
				})
        .then(function () {
          return Leaf.oneAsync({ size: 14 });
        })
				.then(function (leaf) {
					should.equal(leaf.stalkId, null);
				});
    });
  });

  describe("if not passing another Model (promise-based test)", function () {
    it("should use same model", function (done) {
      db.settings.set('instance.identityCache', false);
      db.settings.set('instance.returnAllErrors', true);

      var Person = db.define("person", {
        name : String
      });
      Person.hasOne("parent", {
        autoFetch : true
      });

      helper.dropSync(Person, function () {
        var child = new Person({
          name : "Child"
        });
        child.setParentAsync(new Person({ name: "Parent" })).then(function () {
          done();
        }).catch(function(err) {
          done(err);
        });
      });
    });
  });

  if (protocol != "mongodb") {
    describe("mapsTo Async (promise-based tests)", function () {
      describe("with `mapsTo` set via `hasOne`", function () {
        var leaf = null;

        before(setup());

        before(function (done) {
          Leaf.createAsync({ size: 444, stalkId: stalkId, holeId: holeId }).then(function (lf) {
            leaf = lf;
            done();
          }).catch(function(err) {
            done(err);
          });
        });

        it("should get parent", function (done) {
          leaf.getStalkAsync().then(function (stalk) {

            should.exist(stalk);
            should.equal(stalk.id, stalkId);
            should.equal(stalk.length, 20);
            done();
          }).catch(function(err) {
            done(err);
          });
        });
      });

      describe("with `mapsTo` set via property definition", function () {
        var leaf = null;

        before(setup());

        before(function (done) {
          Leaf.createAsync({ size: 444, stalkId: stalkId, holeId: holeId }).then(function (lf) {
            leaf = lf;
            done();
          }).catch(function(err) {
            done(err);
          });
        });

        it("should get parent", function (done) {
          leaf.getHoleAsync().then(function (hole) {

            should.exist(hole);
            should.equal(hole.id, stalkId);
            should.equal(hole.width, 3);
            done();
          }).catch(function(err) {
            done(err);
          });
        });
      });
    });
  };

});
