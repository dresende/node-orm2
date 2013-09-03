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
	var k, i, pending, prop;
	var primary_keys = opts.id.map(function (k) { return driver.query.escapeId(k); });
	var keys = [];

	for (k in opts.allProperties) {
		prop = opts.allProperties[k];
		definitions.push(buildColumnDefinition(driver, opts.table, k, prop));

		if (prop.type == "enum") {
			typequeries.push(
				"CREATE TYPE " + driver.query.escapeId("enum_" + opts.table + "_" + k) + " AS ENUM (" +
				prop.values.map(driver.query.escapeVal.bind(driver)) + ")"
			);
		}
	}

	for (k in opts.allProperties) {
		prop = opts.allProperties[k];
		if (prop.unique === true) {
			definitions.push("UNIQUE (" + driver.query.escapeId(k) + ")");
		} else if (prop.index) {
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
		for (k in opts.one_associations[i].field) {
			tables[tables.length - 1].subqueries.push(
				"CREATE INDEX ON " + driver.query.escapeId(opts.table) +
				" (" + driver.query.escapeId(k) + ")"
			);
		}
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

		for (k in opts.many_associations[i].mergeId) {
		    definitions.push(buildColumnDefinition(driver, opts.many_associations[i].mergeTable, k, opts.many_associations[i].mergeId[k]));
		}

		for (k in opts.many_associations[i].mergeAssocId) {
		    definitions.push(buildColumnDefinition(driver, opts.many_associations[i].mergeTable, k, opts.many_associations[i].mergeAssocId[k]));
		}

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

		var index = null;
		for (k in opts.many_associations[i].mergeId) {
			if (index == null) index = driver.query.escapeId(k);
			else index += ", " + driver.query.escapeId(k);
		}

		for (k in opts.many_associations[i].mergeAssocId) {
			if (index == null) index = driver.query.escapeId(k);
			else index += ", " + driver.query.escapeId(k);
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
			" (" + index + ")"
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
	var def = driver.query.escapeId(name);
	var customType;

	switch (prop.type) {
	    case "text":
			if (prop.big === true) {
				def += " TEXT";
			} else {
				def += " VARCHAR(" + Math.max(parseInt(prop.size, 10) || 255, 1) + ")";
			}
			break;
		case "serial":
			def += " SERIAL";
			break;
		case "number":
			if (prop.rational === false) {
				def += " " + colTypes.integer[prop.size || 4];
			} else {
				def += " " + colTypes.floating[prop.size || 4];
			}
			break;
		case "boolean":
			def += " BOOLEAN";
			break;
		case "date":
			if (prop.time === false) {
				def += " DATE";
			} else {
				def += " TIMESTAMP WITHOUT TIME ZONE";
			}
			break;
		case "binary":
		case "object":
			def += " BYTEA";
			break;
		case "enum":
			def += " " + driver.query.escapeId("enum_" + table + "_" + name);
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
