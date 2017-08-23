var Promise = require('bluebird');

var build = function (association, opts, keys) {
  var desiredKey = Object.keys(association.field);
  var assocKey = Object.keys(association.mergeAssocId);

  var where = {};
  where[desiredKey] = keys;

  var query = this.query.select()
    .from(association.model.table)
    .select(opts.only)
    .from(association.mergeTable, assocKey, opts.keys)
    .select(desiredKey).as("$p")
    .where(association.mergeTable, where)
    .build();
  return query;
};

module.exports = {
  execQuery: function () {
    if (arguments.length == 2) {
      var query = arguments[0];
      var cb    = arguments[1];
    } else if (arguments.length == 3) {
      var query = this.query.escape(arguments[0], arguments[1]);
      var cb    = arguments[2];
    }
    return this.execSimpleQuery(query, cb);
  },

  execQueryAsync: function () {
    var query = null;
    if (arguments.length === 1) {
      query = arguments[0];
    } else if (arguments.length === 2) {
      query = this.query.escape(arguments[0], arguments[1]);
    }

    if (!query) throw new Error('No query provided.');

    return this.execSimpleQueryAsync(query);
  },

  eagerQueryAsync: function (association, opts, keys) {
    var query = build.apply(this, [association, opts, keys]);
    return this.execSimpleQueryAsync(query);
  },

  eagerQuery: function (association, opts, keys, cb) {
    var query = build.apply(this, [association, opts, keys]);
    this.execSimpleQuery(query, cb);
  }
};
