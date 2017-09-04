var Promise = require('bluebird');

var execQuery = function () {
  if (arguments.length == 2) {
    var query = arguments[0];
    var cb    = arguments[1];
  } else if (arguments.length == 3) {
    var query = this.query.escape(arguments[0], arguments[1]);
    var cb    = arguments[2];
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
  execQuery: execQuery,

  eagerQuery: eagerQuery,

  execQueryAsync: Promise.promisify(execQuery),

  eagerQueryAsync: Promise.promisify(eagerQuery)
};
