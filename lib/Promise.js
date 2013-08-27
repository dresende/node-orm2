exports.Promise = Promise;

function Promise(opts) {
	opts = opts || {};

	var resolved = false;
	var revoked = false;
	var run = false;

	var done_cb   = [];
	var fail_cb   = [];
	var always_cb = [];

	done_cb.push(opts.done);
	fail_cb.push(opts.fail);
	always_cb.push(opts.always);

	var revoke = function (err) {

		if (run) return;

		revoked = run = true;

		for (var i = 0, len = always_cb.length; i < len; i++) {
			if (always_cb[i]) always_cb[i](err, null);
		}
		for (var i = 0, len = fail_cb.length; i < len; i++) {
			if (fail_cb[i]) fail_cb[i](err);
		}
	};

	var resolve = function () {

		if (run) return;

		resolved = run = true;

		var args = Array.prototype.slice.call(arguments);
		for (var i = 0, len = always_cb.length; i < len; i++) {
			if (always_cb[i]) always_cb[i].apply(null, args);
		}
		args = args.slice(1);
		for (var i = 0, len = done_cb.length; i < len; i++) {
			if (done_cb[i]) done_cb[i].apply(null, args);
		}
	};

	return {
		handle: function (promise) {

			promise(function (err) {
				if (err) {
					revoke(err);
				} else {
					resolve.apply(null, arguments);
				}
			});
		},
		done: function (cb) {
			done_cb.push(cb);
			return this;
		},
		fail: function (cb) {
			fail_cb.push(cb);
			return this;
		},
		always: function (cb) {
			always_cb.push(cb);
			return this;
		},
		then: function (done, fail) {
			done_cb.push(done);
			fail_cb.push(fail);
			return this;
		}
	};
}
