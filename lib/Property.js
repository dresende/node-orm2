var ErrorCodes = require("./ErrorCodes");

exports.normalize = function (prop, Settings) {
	if (typeof prop == "function") {
		switch (prop.name) {
			case "String":
				prop = { type: "text" };
				break;
			case "Number":
				prop = { type: "number" };
				break;
			case "Boolean":
				prop = { type: "boolean" };
				break;
			case "Date":
				prop = { type: "date" };
				break;
			case "Object":
				prop = { type: "object" };
				break;
			case "Buffer":
				prop = { type: "binary" };
				break;
		}
	} else if (typeof prop == "string") {
		var tmp = prop;
		prop = {};
		prop.type = tmp;
	} else if (Array.isArray(prop)) {
		prop = { type: "enum", values: prop };
	}

	if ([ "text", "number", "boolean", "date", "enum", "object", "binary", "point" ].indexOf(prop.type) == -1) {
		throw ErrorCodes.generateError(ErrorCodes.NO_SUPPORT, "Unknown property type: " + prop.type);
	}

	if (!prop.hasOwnProperty("required") && Settings.get("properties.required")) {
		prop.required = true;
	}

	return prop;
};

exports.validate = function (value, prop) {
	return value;
};
