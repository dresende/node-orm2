exports.trigger = function () {
	var args = Array.prototype.slice.apply(arguments);
	var self = args.shift();
	var cb   = args.shift();

	if (typeof cb == "function") {
		cb.apply(self, args);
	}
};

exports.wait = function () {
	var args = Array.prototype.slice.apply(arguments);
	var self = args.shift();
	var cb   = args.shift();
	var next = args.shift();

	args.push(next);

	if (typeof cb == "function") {
		cb.apply(self, args);

		if (cb.length < args.length) {
			return next();
		}
	} else {
		return next();
	}
};
