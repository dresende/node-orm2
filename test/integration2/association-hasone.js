var _				= require('lodash');
var should	 = require('should');
var helper	 = require('../support/spec_helper');
var async		= require('async');
var ORM			= require('../../');

describe("hasOne", function() {
	var db   = null;
	var Tree = null;
	var Leaf = null;

	var setup = function (opts) {
		opts = opts || {};
		return function (done) {
			Tree = db.define("tree", { type: String });
			Leaf = db.define("leaf", { size: Number });
			Leaf.hasOne('tree', Tree, { field: 'treeId', autoFetch: !!opts.autoFetch });

			return helper.dropSync([Tree, Leaf], done);
		};
	};

	before(function(done) {
		helper.connect(function (connection) {
			db = connection;
			done();
		});
	});

	var afArr = [false, true];
	for(var i = 0; i < afArr.length; i++) {
		describe("with autofetch = " + afArr[i], function() {
			before(setup({autoFetch: afArr[i]}));

			describe("associating by parent id", function() {
				var tree = null;

				before(function(done) {
					Tree.create({type: "cyprus"},  function(err, item) {
						if (err) throw err;
						tree = item;
						return done();
					});
				});

				it("should work when calling Instance.save", function(done) {
					console.log("before new");
					leaf = new Leaf({size: 4.6, treeId: tree.id});
					console.log("after new", leaf.tree);
					leaf.save(function(err, leaf) {
						if (err) throw err;

						return done();
					});
				});

				it("should work when calling Instance.save after initially setting parentId to null", function(done) {
					leaf = new Leaf({size: 4.6, treeId: null});
					leaf.treeId = tree.id;
					leaf.save(function(err, leaf) {
						if (err) throw err;

						return done();
					});
				});

				it("should work when calling Model.create", function(done) {
					Leaf.create({size: 4.6, treeId: tree.id}, function(err, leaf) {
						if (err) throw err;

						return done();
					});
				});
			});
		});
	};
});
