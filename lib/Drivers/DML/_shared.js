var Promise = require('bluebird');

var generateQuery = function (sql, params) {
  return this.query.escape(sql, params);
};

var execQuery = function () {
  var cb;
  var query;

  if (arguments.length == 2) {
    query = arguments[0];
    cb    = arguments[1];
  } else if (arguments.length == 3) {
    query = this.generateQuery(arguments[0], arguments[1]);
    cb    = arguments[2];
  }
  return this.execSimpleQuery(query, cb);
};

var eagerQuery = function (association, opts, keys, cb) {
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

  this.execSimpleQuery(query, cb);
};

module.exports = {
  generateQuery: generateQuery,

  execQuery: execQuery,

  eagerQuery: eagerQuery,

  execQueryAsync: Promise.promisify(execQuery),

  eagerQueryAsync: Promise.promisify(eagerQuery)
};
