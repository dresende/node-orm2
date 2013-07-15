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
 * Gets all the values within an object or array, optionally using a keys array to get only specific values
 */

exports.values = function (obj, keys) {
    var i, k, vals = [];
    if (keys) {
        for (i = 0; i < keys.length; i++) {
            vals.push(obj[keys[i]]);
        }
    }
    else if (Array.isArray(obj)) {
        for (i = 0; i < obj.length; i++) {
            vals.push(obj[i]);
        }
    }
    else {
        for (k in obj) {
            if (!/[0-9]+/.test(k))
                vals.push(obj[k]);
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
    for (var i = 0; i < model.keys.length; i++) {
        if (typeof target[fields[i]] == 'undefined' || overwrite !== false)
            target[fields[i]] = source[model.keys[i]];
        else if (Array.isArray(target[fields[i]]))
            target[fields[i]].push(source[model.keys[i]]);
        else
            target[fields[i]] = [target[fields[i]], source[model.keys[i]]];
    }
}

exports.getConditions = function (model, fields, from) {
    var conditions = {};
    exports.populateConditions(model, fields, from, conditions);
    return conditions;
}

exports.wrapFieldObject = function (obj, model, altName, alternatives) {
    if (!obj) {
        obj = model.settings.get("properties.association_key").replace("{name}", altName.toLowerCase()).replace("{field}", "id");
    }
    isvalid = false;
    for (var k in obj) {
        if (!/[0-9]+/.test(k) && obj.hasOwnProperty(k)) isvalid = true;
    }
    if (isvalid) return obj;

    newobj = {};
    newobj[obj] = alternatives[obj] || alternatives[model.keys[0]] || { type: 'number', unsigned: true, rational: false };
    return newobj;
};

exports.formatField = function (model, name, required, reversed) {
    var fields = {};
    var keys;
    if (Array.isArray(model.keys)) {
        keys = model.keys;
    }
    else {
        keys = [model.keys];
    }

    for (var i = 0; i < keys.length; i++) {
        var fieldName = reversed ? keys[i] : model.settings.get("properties.association_key").replace("{name}", name.toLowerCase()).replace("{field}", keys[i]);
        var fieldOpts = {
            type: "number",
            unsigned: true,
            rational: false,
            size: 4,
            required: required
        };

        if (model.properties.hasOwnProperty(keys[i])) {
            var p = model.properties[keys[i]];
            fieldOpts = {
                type: p.type || "number",
                size: p.size || 4,
                rational: p.rational || false,
                unsigned: p.unsigned || true,
                time: p.time || false,
                big: p.big || false,
                values: p.values || null,
                required: required
            };
        };

        fields[fieldName] = fieldOpts;
    }

    return fields;
};