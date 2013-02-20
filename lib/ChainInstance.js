module.exports = ChainInstance;

function ChainInstance(chain, cb) {
	var instances = null;
	var loading   = false;
	var queue     = [];

	var load = function () {
		loading = true;
		chain.run(function (err, items) {
			instances = items;

			return next();
		});
	};
	var promise = function(hwd, next) {
		return function () {
			if (!loading) {
				load();
			}

			queue.push({ hwd: hwd, args: arguments });

			return calls;
		};
	};
	var next = function () {
		if (queue.length === 0) return;

		var item = queue.shift();

		item.hwd.apply(calls, item.args);
	};
	var calls = {
		filter: promise(function (cb) {
			instances = instances.filter(cb);

			return next();
		}),
		forEach: promise(function (cb) {
			instances.forEach(cb);

			return next();
		}),
		sort: promise(function (cb) {
			instances.sort(cb);

			return next();
		}),
		count: promise(function (cb) {
			cb(instances.length);

			return next();
		}),
		get: promise(function (cb) {
			cb(instances);

			return next();
		}),
		save: promise(function (cb) {
			var saveNext = function (i) {
				if (i >= instances.length) {
					if (typeof cb == "function") {
						cb();
					}
					return next();
				}

				return instances[i].save(function (err) {
					if (err) {
						if (typeof cb == "function") {
							cb(err);
						}
						return next();
					}

					return saveNext(i + 1);
				});
			};

			return saveNext(0);
		})
	};

	if (typeof cb == "function") {
		return calls.forEach(cb);
	}
	return calls;
}
