exports.check = function (prop) {
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
		}
	} else if (typeof prop == "string") {
		var tmp = prop;
		prop = {};
		prop.type = tmp;
	}

	if ([ "text", "number", "boolean", "date" ].indexOf(prop.type) == -1) {
		throw new Error("Unknown property type: " + prop.type);
	}

	return prop;
};
