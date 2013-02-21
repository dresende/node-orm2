var map = {};

exports.get = function (key, opts, createCb, returnCb) {
	if (opts && opts.cache === false) {
		return createCb(returnCb);
	}
	if (map.hasOwnProperty(key)) {
		if (map[key].t !== null && map[key].t <= Date.now()) {
			delete map[key];
		} else {
			return returnCb(map[key].o);
		}
	}

	createCb(function (value) {
		map[key] = { // object , timeout
			o : value,
			t : (opts && typeof opts.cache == "number" ? Date.now() + (opts.cache * 1000) : null)
		};
		return returnCb(map[key].o);
	});
};
