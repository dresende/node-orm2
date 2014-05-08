var _        = require('lodash');
var ORMError = require("./Error");

var KNOWN_TYPES = [
	"text",   "number", "integer", "boolean", "date", "enum", "object",
	"binary", "point",  "serial"
];

exports.normalize = function (opts) {
	if (typeof opts.prop === "function") {
		switch (opts.prop.name) {
			case "String":
				opts.prop = { type: "text" };
				break;
			case "Number":
				opts.prop = { type: "number" };
				break;
			case "Boolean":
				opts.prop = { type: "boolean" };
				break;
			case "Date":
				opts.prop = { type: "date" };
				break;
			case "Object":
				opts.prop = { type: "object" };
				break;
			case "Buffer":
				opts.prop = { type: "binary" };
				break;
		}
	} else if (typeof opts.prop === "string") {
		var tmp = opts.prop;
		opts.prop = {};
		opts.prop.type = tmp;
	} else if (Array.isArray(opts.prop)) {
		opts.prop = { type: "enum", values: opts.prop };
	} else {
		opts.prop = _.cloneDeep(opts.prop);
	}

	if (KNOWN_TYPES.indexOf(opts.prop.type) === -1 && !(opts.prop.type in opts.customTypes)) {
		throw new ORMError("Unknown property type: " + opts.prop.type, 'NO_SUPPORT');
  }

	if (!opts.prop.hasOwnProperty("required") && opts.settings.get("properties.required")) {
		opts.prop.required = true;
	}

	// Defaults to true. Rational means floating point here.
	if (opts.prop.type == "number" && opts.prop.rational === undefined) {
		opts.prop.rational = true;
	}

	if (!('mapsTo' in opts.prop)) {
		opts.prop.mapsTo = opts.name
	}

	if (opts.prop.type == "number" && opts.prop.rational === false) {
		opts.prop.type = "integer";
		delete opts.prop.rational;
	}

	opts.prop.name = opts.name;

	return opts.prop;
};
