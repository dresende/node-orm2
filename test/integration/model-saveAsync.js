var should   = require('should');
var helper   = require('../support/spec_helper');
var common   = require('../common');

describe("Model.saveAsync()", function() {
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

    it("should use it if not defined", function () {
      var John = new Person();

      return John.saveAsync()
        .then(function () {
          John.name.should.equal("John");
        });
    });
  });

  describe("with callback", function () {
    before(setup());

    it("should save item and return id", function () {
      var John = new Person({
        name: "John"
      });

      return John.saveAsync()
        .then(function () {
          should.exist(John[Person.id]);
          return Person.getAsync(John[Person.id]);
        })
        .then(function (JohnCopy) {
          JohnCopy[Person.id].should.equal(John[Person.id]);
          JohnCopy.name.should.equal(John.name);
        });
    });
  });

  describe("without callback", function () {
    before(setup());

    it("should still save item and return id", function (done) {
      var John = new Person({
        name: "John"
      });
      John.saveAsync();
      John.on("save", function (err) {
        should.equal(err, null);
        should.exist(John[Person.id]);

        Person.getAsync(John[Person.id])
          .then(function (JohnCopy) {
            JohnCopy[Person.id].should.equal(John[Person.id]);
            JohnCopy.name.should.equal(John.name);

            return done();
          });
      });
    });
  });

  describe("with properties object", function () {
    before(setup());

    it("should update properties, save item and return id", function () {
      var John = new Person({
        name: "Jane"
      });
      return John.saveAsync({ name: "John" })
        .then(function () {
          should.exist(John[Person.id]);
          John.name.should.equal("John");

          return Person.getAsync(John[Person.id])
        })
        .then(function (JohnCopy) {
          JohnCopy[Person.id].should.equal(John[Person.id]);
          JohnCopy.name.should.equal(John.name);
        });
    });
  });

  describe("with unknown argument type", function () {
    before(setup());

    it("should should throw", function () {
      var John = new Person({
        name: "Jane"
      });
      return John.saveAsync("will-fail")
        .catch(function (err) {
          err.should.be.an.Object();
        });
    });
  });

  describe("if passed an association instance", function () {
    before(setup());

    it("should save association first and then save item and return id", function () {
      var Jane = new Person({
        name  : "Jane"
      });
      var John = new Person({
        name  : "John",
        parent: Jane
      });

      return John.saveAsync()
        .then(function () {
          John.saved().should.be.true();
          Jane.saved().should.be.true();

          should.exist(John[Person.id]);
          should.exist(Jane[Person.id]);
        });
    });
  });

  describe("if passed an association object", function () {
    before(setup());

    it("should save association first and then save item and return id", function () {
      var John = new Person({
        name  : "John",
        parent: {
          name  : "Jane"
        }
      });

      return John.saveAsync()
        .then(function () {
          John.saved().should.be.true();
          John.parent.saved().should.be.true();

          should.exist(John[Person.id]);
          should.exist(John.parent[Person.id]);
          should.equal(John.parent.name, "Jane");
        });
    });
  });

  describe("if autoSave is on", function () {
    before(setup(null, { autoSave: true }));

    it("should save the instance as soon as a property is changed", function (done) {
      var John = new Person({
        name : "Jhon"
      });

      John.saveAsync()
        .then(function () {
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

      it("off should not save associations but save itself", function () {
        return Person.oneAsync({ name: 'Hagar' })
          .then(function (hagar) {
            should.exist(hagar.parent);

            hagar.parent.name = 'Olga2';
            return [hagar, hagar.saveAsync({name: 'Hagar2'}, { saveAssociations: false })];
          })
          .spread(function (hagar) {
            should.equal(afterSaveCalled, true);

            return Person.getAsync(hagar.parent.id);
          })
          .then(function (olga) {
            should.equal(olga.name, 'Olga');
          });
      });

      it("off should not save associations or itself if there are no changes", function () {
        return Person.oneAsync({ name: 'Hagar' })
          .then(function (hagar) {
            return [hagar, hagar.saveAsync({}, { saveAssociations: false })];
          })
          .spread(function (hagar) {
            should.equal(afterSaveCalled, false);
            return Person.getAsync(hagar.parent.id);
          })
          .then(function (olga) {
            should.equal(olga.name, 'Olga');
          });
      });

      it("unspecified should save associations and itself", function () {
        return Person.oneAsync({ name: 'Hagar' })
          .then(function (hagar) {
            should.exist(hagar.parent);

            hagar.parent.name = 'Olga2';
            return [hagar, hagar.saveAsync({name: 'Hagar2'})];
          })
          .spread(function (hagar) {
            return [hagar, Person.getAsync(hagar.parent.id)];
          })
          .spread(function (hagar, olga) {
            should.equal(olga.name, 'Olga2');

            return Person.getAsync(hagar.id);
          })
          .then(function (person) {
            should.equal(person.name, 'Hagar2');
          });
      });

      it("on should save associations and itself", function () {
        return Person.oneAsync({ name: 'Hagar' })
          .then(function (hagar) {
            should.exist(hagar.parent);

            hagar.parent.name = 'Olga2';
            return [hagar, hagar.saveAsync({name: 'Hagar2'}, { saveAssociations: true })];
          })
          .spread(function (hagar) {
            return [hagar, Person.getAsync(hagar.parent.id)];
          })
          .spread(function (hagar, olga) {
            should.equal(olga.name, 'Olga2');

            return Person.getAsync(hagar.id);
          })
          .then(function (person) {
            should.equal(person.name, 'Hagar2');
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

      it("unspecified should not save associations but save itself", function () {
        return Person.oneAsync({ name: 'Hagar' })
          .then(function (hagar) {
            should.exist(hagar.parent);

            hagar.parent.name = 'Olga2';
            return [hagar, hagar.saveAsync({ name: 'Hagar2' })];
          })
          .spread(function (hagar) {
            return [hagar, Person.getAsync(hagar.parent.id)];
          })
          .spread(function (hagar, olga) {
            should.equal(olga.name, 'Olga');

            return Person.getAsync(hagar.id);
          })
          .then(function (person) {
            should.equal(person.name, 'Hagar2');
          });
      });

      it("off should not save associations but save itself", function () {
        return Person.oneAsync({ name: 'Hagar' })
          .then(function (hagar) {
            should.exist(hagar.parent);

            hagar.parent.name = 'Olga2';
            return [hagar, hagar.saveAsync({ name: 'Hagar2' }, { saveAssociations: false })];
          })
          .spread(function (hagar) {
            should.equal(afterSaveCalled, true);

            return Person.getAsync(hagar.parent.id);
          })
          .then(function (olga) {
            should.equal(olga.name, 'Olga');
          });
      });

      it("on should save associations and itself", function () {
        return Person.oneAsync({ name: 'Hagar' })
          .then(function (hagar) {
            should.exist(hagar.parent);

            hagar.parent.name = 'Olga2';
            return [hagar, hagar.saveAsync({ name: 'Hagar2' }, { saveAssociations: true })];
          })
          .spread(function (hagar) {
            return [hagar, Person.getAsync(hagar.parent.id)];
          })
          .spread(function (hagar, olga) {
            should.equal(olga.name, 'Olga2');

            return Person.getAsync(hagar.id);
          })
          .then(function (person) {
            should.equal(person.name, 'Hagar2');
          });
      });
    });
  });

  describe("with a point property", function () {
    if (common.protocol() == 'sqlite' || common.protocol() == 'mongodb') return;
    before(function (done) {
      setup({ type: "point" })(done);
    });

    it("should save the instance as a geospatial point", function () {
      var John = new Person({
        name: { x: 51.5177, y: -0.0968 }
      });
      return John.saveAsync()
        .then(function () {
          John.name.should.be.an.instanceOf(Object);
          John.name.should.have.property('x', 51.5177);
          John.name.should.have.property('y', -0.0968);
        });
    });
  });
});
