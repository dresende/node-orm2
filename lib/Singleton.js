var map = {};

exports.get = function (key, opts, createCb, returnCb) {
	if (opts && opts.cache === false) {
		return createCb(returnCb);
	}
	if (map.hasOwnProperty(key)) {
		return returnCb(map[key]);
	}

	createCb(function (value) {
		return returnCb(map[key] = value);
	});
};
