var ORMError = require("./Error");

var KNOWN_TYPES = [
	"text",   "number", "integer", "boolean", "date", "enum", "object",
	"binary", "point",  "serial"
]

exports.normalize = function (prop, customTypes, Settings) {
	if (typeof prop === "function") {
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
	} else if (typeof prop === "string") {
		var tmp = prop;
		prop = {};
		prop.type = tmp;
	} else if (Array.isArray(prop)) {
		prop = { type: "enum", values: prop };
	}

	if (KNOWN_TYPES.indexOf(prop.type) === -1 && !(prop.type in customTypes)) {
		throw new ORMError("Unknown property type: " + prop.type, 'NO_SUPPORT');
	}

	if (!prop.hasOwnProperty("required") && Settings.get("properties.required")) {
		prop.required = true;
	}

	// Defaults to true. Rational means floating point here.
	if (prop.type == "number" && prop.rational === undefined) {
		prop.rational = true;
	}

	if (prop.type == "number" && prop.rational === false) {
		prop.type = "integer";
		delete prop.rational;
	}

	return prop;
};

exports.validate = function (value, prop) {
	return value;
};
