exports.Promise = Promise;

function Promise(opts) {
  opts = opts || {};

  var success_cb = opts.success || null;
  var fail_cb    = opts.fail    || null;

  return {
    handle: function (promise) {
      promise(function (err) {
        if (err) {
          if (fail_cb) fail_cb(err);
        } else {
          var args = Array.prototype.slice.call(arguments, 1);

          if (success_cb) success_cb.apply(null, args);
        }
      });
    },
    success: function (cb) {
      success_cb = cb;
      return this;
    },
    fail: function (cb) {
      fail_cb = cb;
      return this;
    }
  };
}
