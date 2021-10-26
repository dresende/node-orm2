var Promise  = require("bluebird");

function promisifyFunctions (target, functions) {
  functions.forEach(function (fnName) {
    target[fnName + 'Async'] = Promise.promisify(target[fnName]);
  });
};

module.exports = {
  promisifyFunctions: promisifyFunctions,
};
