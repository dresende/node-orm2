var ErrorCodes = require("../../ErrorCodes");

exports.drop = function (driver, opts, cb) {
	var i, queries = [], pending;

	queries.push("DROP TABLE IF EXISTS " + driver.query.escapeId(opts.table));

	for (i = 0; i < opts.many_associations.length; i++) {
		queries.push("DROP TABLE IF EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable));
	}

	pending = queries.length;

	for (i = 0; i < queries.length; i++) {
		driver.execQuery(queries[i], function (err) {
			if (--pending === 0) {
				return cb(err);
			}
		});
	}
};

exports.sync = function (driver, opts, cb) {
	var queries = [];
	var definitions = [];
	var k, i, pending, prop;
	var primary_keys = opts.id.map(function (k) { return driver.query.escapeId(k); });
	var keys = [];

	for (k in opts.allProperties) {
		prop = opts.allProperties[k];
		definitions.push(buildColumnDefinition(driver, k, prop));
	}

	for (k in opts.allProperties) {
		prop = opts.allProperties[k];
		if (prop.unique === true) {
			definitions.push("UNIQUE (" + driver.query.escapeId(k) + ")");
		} else if (prop.index) {
			definitions.push("INDEX (" + driver.query.escapeId(k) + ")");
		}
	}

	for (k in opts.allProperties) {
		prop = opts.allProperties[k];
		if (prop.unique === true) {
			definitions.push("UNIQUE KEY " + driver.query.escapeId(k) + " (" + driver.query.escapeId(k) + ")");
		} else if (prop.index) {
			definitions.push("INDEX (" + driver.query.escapeId(k) + ")");
		}
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].extension) continue;
		if (opts.one_associations[i].reversed) continue;
		for (k in opts.one_associations[i].field) {
			definitions.push("INDEX (" + driver.query.escapeId(k) + ")");
		}
	}

	for (i = 0; i < opts.indexes.length; i++) {
		definitions.push("INDEX (" + opts.indexes[i].split(/[,;]+/).map(function (el) {
			return driver.query.escapeId(el);
		}).join(", ") + ")");
	}

	definitions.push("PRIMARY KEY (" + primary_keys.join(", ") + ")");

	queries.push(
		"CREATE TABLE IF NOT EXISTS " + driver.query.escapeId(opts.table) +
		" (" + definitions.join(", ") + ")"
	);

	for (i = 0; i < opts.many_associations.length; i++) {
		definitions = [];

		for (k in opts.many_associations[i].mergeId) {
			definitions.push(buildColumnDefinition(driver, k, opts.many_associations[i].mergeId[k]));
		}

		for (k in opts.many_associations[i].mergeAssocId) {
			definitions.push(buildColumnDefinition(driver, k, opts.many_associations[i].mergeAssocId[k]));
		}

		for (k in opts.many_associations[i].props) {
			definitions.push(buildColumnDefinition(driver, k, opts.many_associations[i].props[k]));
		}

		var index = null;
		for (k in opts.many_associations[i].mergeId) {
			if (index == null) index = driver.query.escapeId(k);
			else index += ", " + driver.query.escapeId(k);
		}

		for (k in opts.many_associations[i].mergeAssocId) {
			if (index == null) index = driver.query.escapeId(k);
			else index += ", " + driver.query.escapeId(k);
		}


		definitions.push("INDEX (" + index + ")");
		queries.push(
			"CREATE TABLE IF NOT EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable) +
			" (" + definitions.join(", ") + ")"
		);
	}

	pending = queries.length;

	for (i = 0; i < queries.length; i++) {
		driver.execQuery(queries[i], function (err) {
			if (--pending === 0) {
				return cb(err);
			}
		});
	}
};

var colTypes = {
	integer:  { 2: 'SMALLINT', 4: 'INTEGER', 8: 'BIGINT' },
	floating: {                4: 'FLOAT',   8: 'DOUBLE' }
};

function buildColumnDefinition(driver, name, prop) {
	var def = driver.query.escapeId(name);
	var customType;

	switch (prop.type) {
	    case "text":
			if (prop.big === true) {
				def += " LONGTEXT";
			} else {
				def += " VARCHAR(" + Math.min(Math.max(parseInt(prop.size, 10) || 255, 1), 65535) + ")";
			}
			break;
		case "serial":
			def += " INT(10) UNSIGNED NOT NULL AUTO_INCREMENT";
			break;
		case "number":
			if (prop.rational === false) {
				def += " " + colTypes.integer[prop.size || 4];
			} else {
				def += " " + colTypes.floating[prop.size || 4];
			}
			if (prop.unsigned === true) {
				def += " UNSIGNED";
			}
			break;
		case "boolean":
			def += " BOOLEAN";
			break;
		case "date":
			if (prop.time === false) {
				def += " DATE";
			} else {
				def += " DATETIME";
			}
			break;
		case "binary":
		case "object":
			if (prop.big === true) {
				def += " LONGBLOB";
			} else {
				def += " BLOB";
			}
			break;
		case "enum":
			def += " ENUM (" +
				   prop.values.map(driver.query.escapeVal.bind(driver.query)) +
			")";
			break;
		case "point":
			def += " POINT";
			break;
		default:
			customType = driver.customTypes[prop.type];
			if (customType) {
				def += " " + customType.datastoreType(prop);
			} else {
				throw ErrorCodes.generateError(ErrorCodes.NO_SUPPORT, "Unknown property type: '" + prop.type + "'", {
					property : prop
				});
			}
	}
	if (prop.required === true) {
		def += " NOT NULL";
	}
	if (prop.hasOwnProperty("defaultValue")) {
		def += " DEFAULT " + driver.query.escapeVal(prop.defaultValue);
	}
	return def;
}
