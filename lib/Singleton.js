var map = {};

exports.clear = function (key) {
	if (typeof key == "string") {
		delete map[key];
	} else {
		map = {};
	}
	return this;
};

exports.get = function (key, opts, createCb, returnCb) {
	if (opts && opts.cache === false) {
		return createCb(returnCb);
	}
	if (map.hasOwnProperty(key)) {
		if (opts && opts.save_check && typeof map[key].o.saved == "function" && !map[key].o.saved()) {
			// if not saved, don't return it, fetch original from db
			return createCb(returnCb);
		} else if (map[key].t !== null && map[key].t <= Date.now()) {
			delete map[key];
		} else  {
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
