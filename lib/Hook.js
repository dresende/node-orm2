exports.trigger = function () {
	var args = Array.prototype.slice.apply(arguments);
	var self = args.shift();
	var cb   = args.shift();

	if (typeof cb == "function") {
		cb.apply(self, args);
	}
};
