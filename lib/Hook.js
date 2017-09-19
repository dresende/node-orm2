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
  var hook = args.shift();
  var next = args.shift();

  args.push(next);
  if (typeof hook === "function") {
    var hookValue = hook.apply(self, args);

    var hookDoesntExpectCallback = hook.length < args.length;
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
  } else {
    return next();
  }
};
