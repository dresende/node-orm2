var map = {};

exports.clear = function (key) {
	if (typeof key === "string") {
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
 	// we've got a custom autoFetch setting for this get/find so don't use the cache
	if(typeof opts.autoFetch !== "undefined") {
		return createCb(returnCb);
	}
	if (map.hasOwnProperty(key)) {
		if (opts && opts.save_check && typeof map[key].o.saved === "function" && !map[key].o.saved()) {
			// if not saved, don't return it, fetch original from db, but don't refresh the cache
			return createCb(returnCb);
		} else if (map[key].t !== null && map[key].t <= Date.now()) {
			delete map[key];
                } else {
			var instance = map[key].o;
			if(instance.__opts.checkAssociations(instance)) {
				// instance in cache has all auto-fetch associations populated - we can re-use it
				return returnCb(null, instance);
			}
		}
	}

        // Can't re-use item in cache - or it's not in cache - re-fetch from db & load the cache
	createCb(function (err, value) {
		if (err) return returnCb(err);

		map[key] = { // object , timeout
			o : value,
			t : (opts && typeof opts.cache === "number" ? Date.now() + (opts.cache * 1000) : null)
		};
		return returnCb(null, map[key].o);
	});
};
