var Promise = require('bluebird');

exports.trigger = function () {
  var args = Array.prototype.slice.apply(arguments);
  var self = args.shift();
  var cb   = args.shift();

  if (typeof cb === "function") {
    cb.apply(self, args);
  }
};

exports.wait = function () {
  var args = Array.prototype.slice.apply(arguments);
  var self = args.shift();
  var hook   = args.shift();
  var next = args.shift();

  args.push(next);
  if (typeof hook === "function") {
    var hookValue = hook.apply(self, args);

    var isHasCallback = hook.length < args.length;

    if (isHasCallback) {
      if (hookValue instanceof Promise) {
        return hookValue
          .then(function () {
            next();
          })
          .catch(function (err) {
            next(err);
          });
      }
      return next();
    }
  } else {
    return next();
  }
};
