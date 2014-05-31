var aliases = require('./aliases');

module.exports.add = addDriver;
module.exports.get = getDriver;


var drivers = {};

function addDriver(name, constructor) {
  drivers[name] = constructor;
}

function getDriver(name) {
  if (name in aliases) {
    return getDriver(aliases[name]);
  } else if (!(name in drivers)) {
    drivers[name] = require("./DML/" + name).Driver;
  }

  return drivers[name];
}
