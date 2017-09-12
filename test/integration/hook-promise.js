var should   = require('should');
var helper   = require('../support/spec_helper');
var async    = require('async');
var Promise  = require('bluebird');

describe("HookPromise", function() {
  var db = null;
  var Person = null;
  var triggeredHooks = {};
  var getTimestamp; // Calling it 'getTime' causes strangeness.

  getTimestamp = function () { return Date.now(); };

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

  describe("beforeCreate", function () {
    beforeEach(setup());
    it("should allow modification of instance", function () {
      Person.beforeCreate(function () {
        var self = this;
        return new Promise(function (resolve) {
          setTimeout(function () {
            self.name = "Hook Worked";
            resolve();
          }, 200);
        });
      });

      return Person.createAsync([{ }])
        .then(function (people) {
          should.exist(people);
          should.equal(people.length, 1);
          should.equal(people[0].name, "Hook Worked");
          // garantee it was correctly saved on database
          Person.one({ name: "Hook Worked" }, function (err, person) {
            should.not.exist(err);
            should.exist(person);
          });
        });
    });

    it("should trigger error", function (done) {
      Person.beforeCreate(function () {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            reject(new Error('beforeCreate-error'));
          }, 200);
        });
      });

      Person.createAsync([{ name: "John Doe" }])
        .then(function () {
          done(new Error('Should throw err.'));
        })
        .catch(function (err) {
          err.should.be.a.Object();
          should.equal(err.message, "beforeCreate-error");
          done();
        });
    });
  });

  describe("beforeSave", function () {
    beforeEach(setup());
    it("should trigger and wait before save hook", function (done) {
      Person.beforeSave(function () {
        return new Promise(function (_, reject) {
          setTimeout(function () {
            reject(new Error('beforeSave-error'));
          }, 400);
        });
      });

      Person.createAsync([{ name: "Jane Doe" }])
        .then(function () {
          done(new Error('Should throw error'));
        })
        .catch(function (err) {
          err.should.be.a.Object();
          should.equal(err.message, "beforeSave-error");
          return done();
        });
    });

    it("should trigger error", function (done) {
      Person.beforeSave(function () {
        return new Promise(function (_, reject) {
          setTimeout(function () {
            reject(new Error('beforeSave-error'));
          }, 400);
        });
      });

      Person.createAsync([{ name: "Jane Doe" }])
        .then(function (John) {
          return John[0].saveAsync();
        })
        .catch(function (err) {
          err.should.be.a.Object();
          should.equal("beforeSave-error", err.message);
          return done();
        });
    });

    it("should trigger and wait", function () {
      Person.beforeSave(function () {
        var self = this;
        return new Promise(function (resolve) {
          setTimeout(function () {
            self.name = 'John Doe';
            resolve();
          }, 400);
        });
      });

      return Person.createAsync([{ name: "Jane Doe" }])
        .then(function (John) {
          return John[0].saveAsync();
        })
        .then(function (John) {
          should.equal(John.name, 'John Doe');
        });
    });
  });

  describe("beforeValidation", function () {
    beforeEach(setup());
    it("should trigger and wait", function () {
      Person.beforeValidation(function () {
        var self = this;
        return new Promise(function (resolve) {
          setTimeout(function () {
            self.name = "John Snow";
            resolve();
          }, 500);
        });
      });

      return Person.createAsync([{ name: "John Doe" }])
        .then(function (Jhon) {
          should.equal(Jhon[0].name, "John Snow");
        });
    });

    it("should throw error", function (done) {
      Person.beforeValidation(function () {
        var self = this;
        return new Promise(function (_, reject) {
          setTimeout(function () {
            self.name = "John Snow";
            reject(new Error("beforeValidation-error"));
          }, 500);
        });
      });

      Person.createAsync([{ name: "John Doe" }])
        .then(function () {
          done(new Error("Should throw error"));
        })
        .catch(function (err) {
          should.equal(err.message, "beforeValidation-error");
          done();
        });
    })
  });

  describe("afterLoad", function () {
    beforeEach(setup());
    it("should trigger and wait", function () {
      var afterLoad = false;
      Person.afterLoad(function () {
        return new Promise(function (resolve) {
          setTimeout(function () {
            afterLoad = true;
            resolve();
          }, 500);
        });
      });

      return Person.createAsync([{ name: "John Doe" }])
        .then(function () {
          should.equal(afterLoad, true);
        });
    });

    it("should throw error", function (done) {
      var afterLoad = false;
      Person.afterLoad(function () {
        return new Promise(function (_, reject) {
          setTimeout(function () {
            afterLoad = true;
            reject(new Error("afterLoad-error"));
          }, 500);
        });
      });

      Person.createAsync([{ name: "John Doe" }])
        .then(function () {
          afterLoad.should.be.true;
          done(new Error("Should throw."));
        })
        .catch(function (err) {
          err.should.exist;
          should.equal("afterLoad-error", err.message);
          done();
        });
    });
  });

  describe("afterAutoFetch", function () {
    beforeEach(setup());
    it("should trigger and wait", function () {
      var afterAutoFetch = false;
      Person.afterAutoFetch(function () {
        return new Promise(function (resolve) {
          setTimeout(function () {
            afterAutoFetch = true;
            resolve();
          }, 1000);
        });
      });

      return Person.createAsync({ name: "John" })
        .then(function () {
          should.equal(afterAutoFetch, true);
        });
    });

    it("should throw error", function (done) {
      var afterAutoFetch = false;
      Person.afterAutoFetch(function () {
        return new Promise(function (_, reject) {
          setTimeout(function () {
            afterAutoFetch = true;
            reject(new Error("afterAutoFetch-error"));
          }, 500);
        });
      });

      Person.createAsync({ name: "John" })
        .then(function () {
          done(new Error("Should throw error"));
        })
        .catch(function (err) {
          should.equal(err.message, "afterAutoFetch-error");
          done();
        });
    });
  });

  describe("beforeRemove", function () {
    before(setup());

    it("should trigger and wait", function () {
      var beforeRemove = false;
      Person.beforeRemove(function () {
        return new Promise(function (resolve) {
          beforeRemove = true;
          resolve();
        });
      });

      return Person.createAsync([{ name: "John Doe" }])
        .then(function (items) {
          return items[0].removeAsync();
        })
        .then(function () {
          should.equal(beforeRemove, true);
        });
    });

    it("should throw error", function (done) {
      Person.beforeRemove(function () {
        return new Promise(function (_, reject) {
          setTimeout(function () {
            reject(new Error('beforeRemove-error'));
          }, 600);
        });
      });

      Person.createAsync([{ name: "John Doe" }])
        .then(function (items) {
          return items[0].removeAsync();
        })
        .then(function () {
          done(new Error('Should throw error'));
        })
        .catch(function (err) {
          should.equal(err.message, 'beforeRemove-error');
          done();
        });
    });
  });

  describe("instance modifications", function () {
    before(setup({
      beforeValidation: function () {
        var self = this;
        return new Promise(function (resolve) {
          setTimeout(function () {
            should.equal(self.name, "John Doe");
            self.name = "beforeValidation";
            resolve();
          }, 800);
        });
      },
      beforeCreate: function () {
        var self = this;
        return new Promise(function (resolve) {
          setTimeout(function () {
            should.equal(self.name, "beforeValidation");
            self.name = "beforeCreate";
            resolve();
          }, 700);
        });
      },
      beforeSave: function () {
        var self = this;
        return new Promise(function (resolve) {
          setTimeout(function () {
            should.equal(self.name, "beforeCreate");
            self.name = "beforeSave";
            resolve();
          }, 500);
        });
      }
    }));

    it("should propagate down hooks", function () {
      return Person.createAsync([{ name: "John Doe" }])
        .then(function (people) {
          should.exist(people);
          should.equal(people.length, 1);
          should.equal(people[0].name, "beforeSave");
        });
    });
  });
});
