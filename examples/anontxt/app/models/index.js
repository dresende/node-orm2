var orm      = require('../../../../');
var settings = require('../../config/settings');

var connection = null;

function setup(db, cb) {
  require('./message')(orm, db);
  require('./comment')(orm, db);

  return cb(null, db);
}

module.exports = function (cb) {
  if (connection) return cb(null, connection);

  orm.connect(settings.database, function (err, db) {
    if (err) return cb(err);

    connection = db;
    db.settings.set('instance.returnAllErrors', true);
    setup(db, cb);
  });
};
