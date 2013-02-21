var map = {};

exports.get = function (key, opts, createCb, returnCb) {
	if (opts && opts.cache === false) {
		return createCb(returnCb);
	}
	if (map.hasOwnProperty(key)) {
		return returnCb(map[key].o);
	}

	createCb(function (value) {
		map[key] = {
			o : value, // object
			t : null   // timeout
		};
		return returnCb(map[key].o);
	});
};
