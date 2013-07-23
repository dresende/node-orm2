/**
 * Order should be a String (with the property name assumed ascending)
 * or an Array or property String names.
 *
 * Examples:
 *
 * 1. 'property1' (ORDER BY property1 ASC)
 * 2. '-property1' (ORDER BY property1 DESC)
 * 3. [ 'property1' ] (ORDER BY property1 ASC)
 * 4. [ '-property1' ] (ORDER BY property1 DESC)
 * 5. [ 'property1', 'A' ] (ORDER BY property1 ASC)
 * 6. [ 'property1', 'Z' ] (ORDER BY property1 DESC)
 * 7. [ '-property1', 'A' ] (ORDER BY property1 ASC)
 * 8. [ 'property1', 'property2' ] (ORDER BY property1 ASC, property2 ASC)
 * 9. [ 'property1', '-property2' ] (ORDER BY property1 ASC, property2 DESC)
 * ...
 */
exports.standardizeOrder = function (order) {
	if (typeof order == "string") {
		if (order[0] == "-") {
			return [ [ order.substr(1), "Z" ] ];
		}
		return [ [ order, "A" ] ];
	}

	var new_order = [], minus;

	for (var i = 0; i < order.length; i++) {
		minus = (order[i][0] == "-");

		if (i < order.length - 1 && [ "A", "Z" ].indexOf(order[i + 1].toUpperCase()) >= 0) {
			new_order.push([
				(minus ? order[i].substr(1) : order[i]),
				order[i + 1]
			]);
			i += 1;
		} else if (minus) {
			new_order.push([ order[i].substr(1), "Z" ]);
		} else {
			new_order.push([ order[i], "A" ]);
		}
	}

	return new_order;
};

/**
 * Gets all the values within an object or array, optionally
 * using a keys array to get only specific values
 */
exports.values = function (obj, keys) {
	var i, k, vals = [];

	if (keys) {
		for (i = 0; i < keys.length; i++) {
			vals.push(obj[keys[i]]);
		}
	} else if (Array.isArray(obj)) {
		for (i = 0; i < obj.length; i++) {
			vals.push(obj[i]);
		}
	} else {
		for (k in obj) {
			if (!/[0-9]+/.test(k)) {
				vals.push(obj[k]);
			}
		}
	}
	return vals;
};

exports.hasValues = function (obj, keys) {
	for (var i = 0; i < keys.length; i++) {
		if (!obj[keys[i]]) return false;
	}
	return true;
};

exports.populateConditions = function (model, fields, source, target, overwrite) {
	for (var i = 0; i < model.id.length; i++) {
		if (typeof target[fields[i]] == 'undefined' || overwrite !== false) {
			target[fields[i]] = source[model.id[i]];
		} else if (Array.isArray(target[fields[i]])) {
			target[fields[i]].push(source[model.id[i]]);
		} else {
			target[fields[i]] = [target[fields[i]], source[model.id[i]]];
		}
	}
}

exports.getConditions = function (model, fields, from) {
	var conditions = {};

	exports.populateConditions(model, fields, from, conditions);

	return conditions;
}

exports.wrapFieldObject = function (obj, model, altName, alternatives) {
	if (!obj) {
		var assoc_key = model.settings.get("properties.association_key");

		if (typeof assoc_key == "function") {
			obj = assoc_key(altName.toLowerCase(), 'id');
		} else {
			obj = assoc_key.replace("{name}", altName.toLowerCase())
			               .replace("{field}", 'id');
		}
	}

	for (var k in obj) {
		if (!/[0-9]+/.test(k) && obj.hasOwnProperty(k)) {
			return obj;
		}
	}

	var new_obj = {};

	new_obj[obj] = alternatives[obj] || alternatives[model.id[0]] || { type: 'number', unsigned: true, rational: false };

	return new_obj;
};

exports.formatField = function (model, name, required, reversed) {
	var fields = {}, field_opts, field_name;
	var keys = model.id;
	var assoc_key = model.settings.get("properties.association_key");

	for (var i = 0; i < keys.length; i++) {
		if (reversed) {
			field_name = keys[i];
		} else if (typeof assoc_key == "function") {
			field_name = assoc_key(name.toLowerCase(), keys[i]);
		} else {
			field_name = assoc_key.replace("{name}", name.toLowerCase())
			                      .replace("{field}", keys[i]);
		}

		if (model.properties.hasOwnProperty(keys[i])) {
			var p = model.properties[keys[i]];

			field_opts = {
				type     : p.type || "number",
				size     : p.size || 4,
				rational : p.rational || false,
				unsigned : p.unsigned || true,
				time     : p.time || false,
				big      : p.big || false,
				values   : p.values || null,
				required : required
			};
		} else {
			field_opts = {
				type     : "number",
				unsigned : true,
				rational : false,
				size     : 4,
				required : required
			};
		}

		fields[field_name] = field_opts;
	}

	return fields;
};

exports.getRealPath = function (path_str, stack_index) {
	var path = require("path"); // for now, load here (only when needed)
	var cwd = process.cwd();
	var err = new Error();
	var tmp = err.stack.split(/\r?\n/)[typeof stack_index != "undefined" ? stack_index : 3], m;

	if ((m = tmp.match(/^\s*at\s+(.+):\d+:\d+$/)) !== null) {
		cwd = path.dirname(m[1]);
	} else if ((m = tmp.match(/^\s*at\s+module\.exports\s+\((.+?)\)/)) !== null) {
		cwd = path.dirname(m[1]);
	} else if ((m = tmp.match(/^\s*at\s+.+\s+\((.+):\d+:\d+\)$/)) !== null) {
		cwd = path.dirname(m[1]);
	}

	if (path_str[0] != path.sep) {
		path_str = cwd + "/" + path_str;
	}
	if (path_str.substr(-1) == path.sep) {
		path_str += "index";
	}

	return path_str;
};
