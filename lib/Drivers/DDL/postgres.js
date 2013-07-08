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
	var tables = [];
	var subqueries = [];
	var typequeries = [];
	var definitions = [];
	var k, i, pending;
	var primary_keys = opts.keys.map(function (k) { return driver.query.escapeId(k); });
	var keys = [];

	for (i = 0; i < opts.keys.length; i++) {
		if (opts.properties.hasOwnProperty(opts.keys[i])) continue;

		keys.push(driver.query.escapeId(opts.keys[i]));
	}

	for (i = 0; i < keys.length; i++) {
		definitions.push(keys[i] + " INTEGER NOT NULL");
	}
	if (opts.keys.length == 1 && !opts.extension) {
		definitions[definitions.length - 1] = keys[0] + " SERIAL";
	}

	for (k in opts.properties) {
		definitions.push(buildColumnDefinition(driver, opts.table, k, opts.properties[k]));

		if (opts.properties[k].type == "enum") {
			typequeries.push(
				"CREATE TYPE " + driver.query.escapeId("enum_" + opts.table + "_" + k) + " AS ENUM (" +
				opts.properties[k].values.map(driver.query.escapeVal.bind(driver)) + ")"
			);
		}
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].extension) continue;
		if (opts.one_associations[i].reversed) continue;
		definitions.push(
			driver.query.escapeId(opts.one_associations[i].field) + " INTEGER" +
			(opts.one_associations[i].required ? ' NOT NULL' : '')
		);
	}

	for (k in opts.properties) {
		if (opts.properties[k].unique === true) {
			definitions.push("UNIQUE (" + driver.query.escapeId(k) + ")");
		} else if (opts.properties[k].index) {
			definitions.push("INDEX (" + driver.query.escapeId(k) + ")");
		}
	}

	definitions.push("PRIMARY KEY (" + primary_keys.join(", ") + ")");

	tables.push({
		name       : opts.table,
		query      : "CREATE TABLE " + driver.query.escapeId(opts.table) +
		             " (" + definitions.join(", ") + ")",
		typequeries: typequeries,
		subqueries : subqueries
	});

	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].extension) continue;
		if (opts.one_associations[i].reversed) continue;
		tables[tables.length - 1].subqueries.push(
			"CREATE INDEX ON " + driver.query.escapeId(opts.table) +
			" (" + driver.query.escapeId(opts.one_associations[i].field) + ")"
		);
	}

	for (i = 0; i < opts.indexes.length; i++) {
		tables[tables.length - 1].subqueries.push(
			"CREATE INDEX ON " + driver.query.escapeId(opts.table) +
			" (" + opts.indexes[i].split(/[,;]+/).map(function (el) {
				return driver.query.escapeId(el);
			}).join(", ") + ")"
		);
	}

	for (i = 0; i < opts.many_associations.length; i++) {
		definitions = [];
		typequeries = [];

		definitions.push(driver.query.escapeId(opts.many_associations[i].mergeId) + " INTEGER NOT NULL");
		definitions.push(driver.query.escapeId(opts.many_associations[i].mergeAssocId) + " INTEGER NOT NULL");

		for (k in opts.many_associations[i].props) {
			definitions.push(buildColumnDefinition(driver, opts.many_associations[i].mergeTable,
			                                       k, opts.many_associations[i].props[k]));
			if (opts.many_associations[i].props[k].type == "enum") {
				typequeries.push(
					"CREATE TYPE " + driver.query.escapeId("enum_" + opts.many_associations[i].mergeTable + "_" + k) + " AS ENUM (" +
					opts.many_associations[i].props[k].values.map(driver.query.escapeVal.bind(driver)) + ")"
				);
			}
		}

		tables.push({
			name       : opts.many_associations[i].mergeTable,
			query      : "CREATE TABLE IF NOT EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable) +
			             " (" + definitions.join(", ") + ")",
			typequeries: typequeries,
			subqueries : []
		});
		tables[tables.length - 1].subqueries.push(
			"CREATE INDEX ON " + driver.query.escapeId(opts.many_associations[i].mergeTable) +
			" (" +
			driver.query.escapeId(opts.many_associations[i].mergeId) + ", " +
			driver.query.escapeId(opts.many_associations[i].mergeAssocId) +
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
	var pending = table.typequeries.length;
	var createTable = function () {
		driver.execQuery(table.query, function (err) {
			if (err || table.subqueries.length === 0) {
				return cb(err);
			}

			var pending = table.subqueries.length;

			for (var i = 0; i < table.subqueries.length; i++) {
				driver.execQuery(table.subqueries[i], function (err) {
					if (--pending === 0) {
						return cb();
					}
				});
			}
		});
	};

	if (pending === 0) {
		return createTable();
	}

	for (var i = 0; i < table.typequeries.length; i++) {
		driver.execQuery(table.typequeries[i], function (err) {
			if (--pending === 0) {
				return createTable();
			}
		});
	}
}

var colTypes = {
	integer:  { 2: 'SMALLINT', 4: 'INTEGER', 8: 'BIGINT' },
	floating: {                4: 'REAL',    8: 'DOUBLE PRECISION' }
};

function buildColumnDefinition(driver, table, name, prop) {
	var def;

	switch (prop.type) {
		case "text":
			def = driver.query.escapeId(name) + " VARCHAR(" + Math.min(Math.max(parseInt(prop.size, 10) || 255, 1), 65535) + ")";
			break;
		case "number":
			if (prop.rational === false) {
				def = driver.query.escapeId(name) + " " + colTypes.integer[prop.size || 4];
			} else {
				def = driver.query.escapeId(name) + " " + colTypes.floating[prop.size || 4];
			}
			break;
		case "boolean":
			def = driver.query.escapeId(name) + " BOOLEAN";
			break;
		case "date":
			if (prop.time === false) {
				def = driver.query.escapeId(name) + " DATE";
			} else {
				def = driver.query.escapeId(name) + " TIMESTAMP WITHOUT TIME ZONE";
			}
			break;
		case "binary":
		case "object":
			def = driver.query.escapeId(name) + " BYTEA";
			break;
		case "enum":
			def = driver.query.escapeId(name) + " " + driver.query.escapeId("enum_" + table + "_" + name);
			break;
		case "point":
			def = driver.query.escapeId(name) + " POINT";
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
