var settings = {
	properties : {
		primary_key : "id"
	}
};

exports.set = function (key, value) {
	set(key, value, settings);

	return this;
};

exports.get = function (key) {
	return get(key, settings);
};

function set(key, value, obj) {
	var p = key.indexOf(".");

	if (p == -1) {
		return obj[key] = value;
	}

	if (!obj.hasOwnProperty(key.substr(0, p))) {
		obj[key.substr(0, p)] = {};
	}

	return set(key.substr(p + 1), value, obj[key.substr(0, p)]);
}

function get(key, obj) {
	var p = key.indexOf(".");

	if (p == -1) {
		return obj[key];
	}

	if (!obj.hasOwnProperty(key.substr(0, p))) {
		return undefined;
	}

	return get(key.substr(p + 1), obj[key.substr(0, p)]);
}
