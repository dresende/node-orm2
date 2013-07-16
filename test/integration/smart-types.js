var should   = require('should');
var helper   = require('../support/spec_helper');
var ORM      = require('../../');

describe("Smart types", function () {
    this.timeout(0);
	var db = null;
	var User = null;
	var Profile = null;
	var Post = null;
	var Group = null;

	var setup = function () {
		return function (done) {
		    User = db.define("user", {
		        username: { type: 'text', size: 64 },
                password: { type: 'text', size: 128 }
		    }, {
                id: 'username'
		    });

		    Profile = User.extendsTo("profile", {
		        firstname: String,
                lastname: String
		    }, {
		        reverse: 'user',
                required: true
		    });

		    Group = db.define("group", {
		        name: { type: 'text', size: 64 }
		    }, {
                id: 'name'
		    });
		    Group.hasMany('users', User, {}, {
                reverse: 'groups'
		    });

		    Post = db.define("post", {
                content: String
		    }, {

		    });
		    Post.hasOne('user', User, {
                reverse: 'posts'
		    });

			ORM.singleton.clear();
			return helper.dropSync([ User, Profile, Group, Post ], function () {
			    User.create({
			        username: 'billy',
			        password: 'hashed password'
			    }, function (err, billy) {
			        should.not.exist(err);
			        billy.setProfile(new Profile({ firstname: 'William', lastname: 'Franklin' }), function (err, profile) {
			            should.not.exist(err);
			            billy.addGroups([new Group({ name: 'admins' }), new Group({ name: 'developers' })], function (err, groups) {
			                should.not.exist(err);
			                billy.setPosts(new Post({content: 'Hello world!'}), function(err, posts) {
			                    should.not.exist(err);
			                    done();
			                });
			            });
			        });
			    });
			});
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

	describe("extends", function () {
		before(setup());

		it("should be able to get extendsTo with custom id", function (done) {
		    User.get('billy', function (err, billy) {
		        should.not.exist(err);
		        should.exist(billy);

		        billy.getProfile(function (err, profile) {
		            should.not.exist(err);
		            should.exist(profile);
		            should.equal(profile.firstname, 'William');
		            should.equal(profile.lastname, 'Franklin');

		            done();
		        });
		    });
		});

		it("should be able to get hasOne with custom id", function (done) {
		    User.get('billy', function (err, billy) {
		        should.not.exist(err);
		        should.exist(billy);

		        billy.getPosts(function (err, posts) {
		            should.not.exist(err);
		            should.exist(posts);
		            should.equal(posts.length, 1);
		            should.equal(posts[0].content, 'Hello world!');

		            done();
		        });
		    });
		});

		it("should be able to get hasMany with custom id", function (done) {
		    User.get('billy', function (err, billy) {
		        should.not.exist(err);
		        should.exist(billy);

		        billy.getGroups(function (err, groups) {
		            should.not.exist(err);
		            should.exist(groups);
		            should.equal(groups.length, 2);

		            done();
		        });
		    });
		});
		
	});
});
