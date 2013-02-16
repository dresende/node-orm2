module.exports = ChainInstance;

function ChainInstance(chain) {
	var instances = null;
	var loading   = false;
	var queue     = [];

	var load = function () {
		loading = true;
		console.log("loading..");
		chain.run(function (err, items) {
			instances = items;

			console.log("loaded");
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
		map: promise(function (cb) {
			for (var i = 0; i < instances.length; i++) {
				cb(instances[i]);
			}
			return next();
		}),
		save: promise(function () {
			console.log("save!?");
		})
	};
	return calls;
}
