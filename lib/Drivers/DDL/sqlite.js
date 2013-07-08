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
	var k, i, pending;
	var primary_keys = opts.keys.map(function (k) { return driver.query.escapeId(k); });
	var keys = [];

	for (i = 0; i < opts.keys.length; i++) {
		if (opts.properties.hasOwnProperty(opts.keys[i])) continue;

		keys.push(driver.query.escapeId(opts.keys[i]));
	}

	for (i = 0; i < keys.length; i++) {
		definitions.push(keys[i] + " INTEGER UNSIGNED NOT NULL");
	}
	if (opts.keys.length == 1 && !opts.extension) {
		definitions[definitions.length - 1] = keys[0] + " INTEGER PRIMARY KEY AUTOINCREMENT";
	}

	for (k in opts.properties) {
		definitions.push(buildColumnDefinition(driver, k, opts.properties[k]));
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].extension) continue;
		if (opts.one_associations[i].reversed) continue;
		definitions.push(
			driver.query.escapeId(opts.one_associations[i].field) + " INTEGER UNSIGNED" +
			(opts.one_associations[i].required ? ' NOT NULL' : '')
		);
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
		queries.push(
			"CREATE INDEX IF NOT EXISTS " + driver.query.escapeId(opts.table + "_" + opts.one_associations[i].field) +
			" ON " + driver.query.escapeId(opts.table) +
			" (" + driver.query.escapeId(opts.one_associations[i].field) + ")"
		);
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

		definitions.push(driver.query.escapeId(opts.many_associations[i].mergeId) + " INTEGER UNSIGNED NOT NULL");
		definitions.push(driver.query.escapeId(opts.many_associations[i].mergeAssocId) + " INTEGER UNSIGNED NOT NULL");

		for (k in opts.many_associations[i].props) {
			definitions.push(buildColumnDefinition(driver, k, opts.many_associations[i].props[k]));
		}

		queries.push(
			"CREATE TABLE IF NOT EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable) +
			" (" + definitions.join(", ") + ")"
		);
		queries.push(
			"CREATE INDEX IF NOT EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable) +
			" ON " + driver.query.escapeId(opts.table) +
			" (" + driver.query.escapeId(opts.many_associations[i].mergeId) + ", " + driver.query.escapeId(opts.many_associations[i].mergeAssocId) + ")"
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
	var def;

	switch (prop.type) {
		case "text":
			def = driver.query.escapeId(name) + " TEXT";
			break;
		case "number":
			if (prop.rational === false) {
				def = driver.query.escapeId(name) + " INTEGER";
			} else {
				def = driver.query.escapeId(name) + " REAL";
			}
			break;
		case "boolean":
			def = driver.query.escapeId(name) + " INTEGER UNSIGNED";
			break;
		case "date":
			def = driver.query.escapeId(name) + " DATETIME";
			break;
		case "binary":
		case "object":
			def = driver.query.escapeId(name) + " BLOB";
			break;
		case "enum":
			def = driver.query.escapeId(name) + " INTEGER";
			break;
		default:
			throw ErrorCodes.generateError(ErrorCodes.NO_SUPPORT, "Unknown property type: '" + prop.type + "'", {
				property : prop
			});
	}
	if (prop.required === true) {
		def += " NOT NULL";
	}
	if (prop.hasOwnProperty("defaultValue")) {
		def += " DEFAULT " + driver.query.escapeVal(prop.defaultValue);
	}
	return def;
}
