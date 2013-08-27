exports.Promise = Promise;

function Promise(opts) {
	opts = opts || {};

	var success_cb  = [];
	var fail_cb     = [];
	var complete_cb = [];

	success_cb.push(opts.success);
	fail_cb.push(opts.fail);
	complete_cb.push(opts.complete);

	return {
		handle: function (promise) {
			promise(function (err) {

				if (err) {
					for (var i = 0, len = complete_cb.length; i < len; i++) {
						if (complete_cb[i]) complete_cb[i](err, null);
					}
					for (var i = 0, len = fail_cb.length; i < len; i++) {
						if (fail_cb[i]) fail_cb[i](err);
					}
				} else {
					var args = Array.prototype.slice.call(arguments);
					for (var i = 0, len = complete_cb.length; i < len; i++) {
						if (complete_cb[i]) complete_cb[i].apply(null, args);
					}
					args = args.slice(1);
					for (var i = 0, len = success_cb.length; i < len; i++) {
						if (success_cb[i]) success_cb[i].apply(null, args);
					}
				}
			});
		},
		success: function (cb) {
			success_cb.push(cb);
			return this;
		},
		fail: function (cb) {
			fail_cb.push(cb);
			return this;
		},
		complete: function (cb) {
			complete_cb.push(cb);
			return this;
		},
		then: function (success, error) {
			success_cb.push(success);
			fail_cb.push(error);
			return this;
		}
	};
}
