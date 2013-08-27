exports.Promise = Promise;

function Promise(opts) {
	opts = opts || {};

	var success_cb  = opts.success  || null;
	var fail_cb     = opts.fail     || null;
	var complete_cb = opts.complete || null;

	return {
		handle: function (promise) {
			promise(function (err) {

				if (err) {
					if (complete_cb) complete_cb(err, null);
					if (fail_cb) fail_cb(err);
				} else {
					var args = Array.prototype.slice.call(arguments);
					if (complete_cb) complete_cb.apply(null, args);
					if (success_cb) success_cb.apply(null, args.slice(1));
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
		},
		complete: function (cb) {
			complete_cb = cb;
			return this;
		}
	};
}
