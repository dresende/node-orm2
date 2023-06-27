exports.trigger = function () {
  var args = Array.prototype.slice.apply(arguments);
  var self = args.shift();
  var cb   = args.shift();

  if (typeof cb === "function") {
    cb.apply(self, args);
  }
};

exports.wait = function (self, hook, next, opts) {
  if (typeof hook !== "function") {
    return next();
  }

  var hookDoesntExpectCallback = hook.length < 1;
  var hookValue;
  if (opts) {
    hookValue = hook.call(self, opts, next);
    hookDoesntExpectCallback = hook.length < 2;
  } else {
    hookValue = hook.call(self, next);
  }

  var isPromise = hookValue && typeof(hookValue.then) === "function";

  if (hookDoesntExpectCallback) {
    if (isPromise) {
      return hookValue
        .then(function () {
          next();
        })
        .catch(next);
    }
    return next();
  }
};
