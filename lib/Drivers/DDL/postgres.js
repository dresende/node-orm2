exports.drop = function (driver, opts, cb) {
	var queries = [], pending;

	queries.push("DROP TABLE IF EXISTS " + driver.escapeId(opts.table));

	for (i = 0; i < opts.many_associations.length; i++) {
		queries.push("DROP TABLE IF EXISTS " + driver.escapeId(opts.many_associations[i].mergeTable));
	}

	pending = queries.length;
	for (i = 0; i < queries.length; i++) {
		driver.db.query(queries[i], function (err) {
			if (--pending === 0) {
				return cb(err);
			}
		});
	}
};

exports.sync = function (driver, opts, cb) {
	var tables = [];
	var subqueries = [];
	var definitions = [];
	var k, i, pending, tmp;

	definitions.push(driver.escapeId(opts.id) + " SERIAL PRIMARY KEY");

	for (k in opts.properties) {
		definitions.push(buildColumnDefinition(driver, opts.table, k, opts.properties[k]));

		if (opts.properties[k].type == "enum") {
			subqueries.push(
				"CREATE TYPE " + tmp + " AS ENUM (" +
				opts.properties[k].values.map(driver.escape.bind(driver)) + ")"
			);
		}
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].reversed) continue;
		definitions.push(driver.escapeId(opts.one_associations[i].field) + " INTEGER NOT NULL");
	}
	for (k in opts.properties) {
		if (opts.properties[k].unique === true) {
			definitions.push("UNIQUE (" + driver.escapeId(k) + ")");
		}
	}

	tables.push({
		name       : opts.table,
		query      : "CREATE TABLE " + driver.escapeId(opts.table) +
		             " (" + definitions.join(", ") + ")",
		subqueries : subqueries
	});
	tables[tables.length - 1].subqueries.push(
		"CREATE INDEX ON " + driver.escapeId(opts.table) +
		" (" + driver.escapeId(opts.id) + ")"
	);

	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].reversed) continue;
		tables[tables.length - 1].subqueries.push(
			"CREATE INDEX ON " + driver.escapeId(opts.table) +
			" (" + driver.escapeId(opts.one_associations[i].field) + ")"
		);
	}

	for (i = 0; i < opts.many_associations.length; i++) {
		definitions = [];

		definitions.push(driver.escapeId(opts.many_associations[i].mergeId) + " INTEGER NOT NULL");
		definitions.push(driver.escapeId(opts.many_associations[i].mergeAssocId) + " INTEGER NOT NULL");

		for (k in opts.many_associations[i].props) {
			definitions.push(buildColumnDefinition(driver, opts.many_associations[i].mergeTable,
			                                       k, opts.many_associations[i].props[k]));
		}

		tables.push({
			name       : opts.many_associations[i].mergeTable,
			query      : "CREATE TABLE IF NOT EXISTS " + driver.escapeId(opts.many_associations[i].mergeTable) +
			             " (" + definitions.join(", ") + ")",
			subqueries : []
		});
		tables[tables.length - 1].subqueries.push(
			"CREATE INDEX ON " + driver.escapeId(opts.many_associations[i].mergeTable) +
			" (" +
			driver.escapeId(opts.many_associations[i].mergeId) + ", " +
			driver.escapeId(opts.many_associations[i].mergeAssocId) +
			")"
		);
	}

	pending = tables.length;
	for (i = 0; i < tables.length; i++) {
		createTableSchema(driver, tables[i], function (err) {
			if (--pending === 0) {
				// this will bring trouble in the future...
				// some errors are not avoided (like ENUM types already defined, etc..)
				return cb(err);
			}
		});
	}
};

function createTableSchema(driver, table, cb) {
	driver.db.query(table.query, function (err) {
		if (err || table.subqueries.length === 0) {
			return cb();
		}

		var pending = table.subqueries.length;

		for (var i = 0; i < table.subqueries.length; i++) {
			driver.db.query(table.subqueries[i], function (err) {
				if (--pending === 0) {
					return cb();
				}
			});
		}
	});
}

function buildColumnDefinition(driver, table, name, prop) {
	var def;

	switch (prop.type) {
		case "text":
			def = driver.escapeId(name) + " VARCHAR(" + Math.min(Math.max(parseInt(prop.size, 10) || 255, 1), 65535) + ")";
			break;
		case "number":
			if (prop.rational === false) {
				def = driver.escapeId(name) + " INTEGER";
			} else {
				def = driver.escapeId(name) + " REAL";
			}
			break;
		case "boolean":
			def = driver.escapeId(name) + " BOOLEAN NOT NULL";
			break;
		case "date":
			if (prop.time === false) {
				def = driver.escapeId(name) + " DATE";
			} else {
				def = driver.escapeId(name) + " TIMESTAMP WITHOUT TIME ZONE";
			}
			break;
		case "binary":
			def = driver.escapeId(name) + " BYTEA";
			break;
		case "enum":
			def = driver.escapeId(name) + " " + driver.escapeId("enum_" + table + "_" + name);
			break;
		default:
			throw new Error("Unknown property type: '" + prop.type + "'");
	}
	if (prop.hasOwnProperty("defaultValue")) {
		def += " DEFAULT " + driver.escape(prop.defaultValue);
	}
	return def;
}
