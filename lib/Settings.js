var settings = {
	properties : {
		primary_key     : "id",
		association_key : "{name}_id"
	}
};

exports.set = function (key, value) {
	set(key, value, settings);

	return this;
};

exports.get = function (key, def) {
	return get(key, def, settings);
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

function get(key, def, obj) {
	var p = key.indexOf(".");

	if (p == -1) {
		if (!obj.hasOwnProperty(key)) {
			return obj[key];
		}
		return def;
	}

	if (!obj.hasOwnProperty(key.substr(0, p))) {
		return def;
	}

	return get(key.substr(p + 1), def, obj[key.substr(0, p)]);
}
