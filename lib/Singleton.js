var map = {};

exports.get = function (key, createCb, returnCb) {
	if (map.hasOwnProperty(key)) {
		return map[key];
	}

	createCb(function (value) {
		return returnCb(map[key] = value);
	});
};
