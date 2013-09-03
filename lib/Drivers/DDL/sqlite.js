var ErrorCodes = require("../../ErrorCodes");

exports.drop = function (driver, opts, cb) {
	var i, queries = [], pending;

	queries.push("DROP TABLE IF EXISTS " + driver.query.escapeId(opts.table));

	for (i = 0; i < opts.many_associations.length; i++) {
		queries.push("DROP TABLE IF EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable));
	}

	pending = queries.length;
	for (i = 0; i < queries.length; i++) {
		driver.db.all(queries[i], function (err) {
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

	if (keys.length > 1) {
		definitions.push("PRIMARY KEY (" + primary_keys.join(", ") + ")");
	}

	queries.push(
		"CREATE TABLE IF NOT EXISTS " + driver.query.escapeId(opts.table) +
		" (" + definitions.join(", ") + ")"
	);
	for (k in opts.properties) {
		if (opts.properties[k].unique === true) {
			queries.push(
				"CREATE UNIQUE INDEX IF NOT EXISTS " + driver.query.escapeId(k) +
				" ON " + driver.query.escapeId(opts.table) +
				" (" + driver.query.escapeId(k) + ")"
			);
		} else if (opts.properties[k].index) {
			queries.push(
				"CREATE INDEX IF NOT EXISTS " + driver.query.escapeId(k) +
				" ON " + driver.query.escapeId(opts.table) +
				" (" + driver.query.escapeId(k) + ")"
			);
		}
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].extension) continue;
		if (opts.one_associations[i].reversed) continue;
		for (k in opts.one_associations[i].field) {
			queries.push(
			"CREATE INDEX IF NOT EXISTS " + driver.query.escapeId(opts.table + "_" + k) +
			" ON " + driver.query.escapeId(opts.table) +
			" (" + driver.query.escapeId(k) + ")"
		);
		}
	}

	for (i = 0; i < opts.indexes.length; i++) {
		queries.push(
			"CREATE INDEX IF NOT EXISTS " + driver.query.escapeId(opts.table + "_index" + i) +
			" ON " + driver.query.escapeId(opts.table) +
			" (" + opts.indexes[i].split(/[,;]+/).map(function (el) {
				return driver.query.escapeId(el);
			}).join(", ") + ")"
		);
	}

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

		queries.push(
			"CREATE TABLE IF NOT EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable) +
			" (" + definitions.join(", ") + ")"
		);
		queries.push(
			"CREATE INDEX IF NOT EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable) +
			" ON " + driver.query.escapeId(opts.table) +
			" (" + index + ")"
		);
	}

	pending = queries.length;
	for (i = 0; i < queries.length; i++) {
		driver.db.all(queries[i], function (err) {
			// if (err) console.log(err);
			if (--pending === 0) {
				return cb(err);
			}
		});
	}
};

function buildColumnDefinition(driver, name, prop) {
	var def = driver.query.escapeId(name);
	var customType;

	switch (prop.type) {
		case "text":
			def += " TEXT";
			break;
		case "serial":
			def += " INTEGER PRIMARY KEY AUTOINCREMENT";
			break;
		case "number":
			if (prop.rational === false) {
				def += " INTEGER";
			} else {
				def += " REAL";
			}
			break;
		case "boolean":
			def += " INTEGER UNSIGNED";
			break;
		case "date":
			def += " DATETIME";
			break;
		case "binary":
		case "object":
			def += " BLOB";
			break;
		case "enum":
			def += " INTEGER";
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
