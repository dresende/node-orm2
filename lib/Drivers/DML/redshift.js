var Promise  = require("bluebird");
var util     = require("util");
var postgres = require("./postgres");

exports.Driver = Driver;

function Driver(config, connection, opts) {
  postgres.Driver.call(this, config, connection, opts);
}

util.inherits(Driver, postgres.Driver);

Driver.prototype.insert = function (table, data, keyProperties, cb) {
  var q = this.query.insert()
                    .into(table)
                    .set(data)
                    .build();

  if (this.opts.debug) {
    require("../../Debug").sql('postgres', q);
  }
  this.execQuery(q, function (err, result) {
    if (err)            return cb(err);
    if (!keyProperties) return cb(null);

    var i, ids = {}, prop;

    if (keyNames.length == 1) {
      this.execQuery("SELECT LASTVAL() AS id", function (err, results) {
        if (err) return cb(err);

        ids[keyProperties[0].name] = results[0].id || null;
        return cb(null, ids);
      });
    } else {
      for(i = 0; i < keyProperties.length; i++) {
        prop = keyProperties[i];
                                // Zero is a valid value for an ID column
        ids[prop.name] = data[prop.mapsTo] !== undefined ? data[prop.mapsTo] : null;
      }

      return cb(null, ids);
    }
  }.bind(this));
};
Driver.prototype.insertAsync = Promise.promisify(Driver.prototype.insert);
