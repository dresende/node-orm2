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

	definitions.push(driver.escapeId(opts.id) + " SERIAL");

	for (k in opts.properties) {
		switch (opts.properties[k].type) {
			case "text":
				definitions.push(driver.escapeId(k) + " VARCHAR(" + Math.min(Math.max(parseInt(opts.properties[k].size, 10) || 255, 1), 10485760) + ")");
				break;
			case "number":
				definitions.push(driver.escapeId(k) + " REAL");
				break;
			case "boolean":
				definitions.push(driver.escapeId(k) + " BOOLEAN NOT NULL");
				break;
			case "date":
				if (opts.properties[k].time === false) {
					definitions.push(driver.escapeId(k) + " DATE");
				} else {
					definitions.push(driver.escapeId(k) + " TIMESTAMP WITHOUT TIME ZONE"); // hmm... I'm not sure..
				}
				break;
			case "binary":
				definitions.push(driver.escapeId(k) + " BYTEA");
				break;
			case "enum":
				tmp = driver.escapeId("enum_" + opts.table + "_" + k);
				subqueries.push(
					"CREATE TYPE " + tmp + " AS ENUM (" +
					opts.properties[k].values.map(driver.escape.bind(driver.db)) + ")"
				);
				definitions.push(driver.escapeId(k) + " " + tmp);
				break;
			default:
				throw new Error("Unknown property type: '" + opts.properties[k].type + "'");
		}
	}

	for (i = 0; i < opts.one_associations.length; i++) {
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
		tables[tables.length - 1].subqueries.push(
			"CREATE INDEX ON " + driver.escapeId(opts.table) +
			" (" + driver.escapeId(opts.one_associations[i].field) + ")"
		);
	}

	for (i = 0; i < opts.many_associations.length; i++) {
		tables.push({
			name       : opts.many_associations[i].mergeTable,
			query      : "CREATE TABLE IF NOT EXISTS " + driver.escapeId(opts.many_associations[i].mergeTable) +
			             " (" +
			             driver.escapeId(opts.many_associations[i].mergeId) + " INTEGER NOT NULL, " +
			             driver.escapeId(opts.many_associations[i].mergeAssocId) + " INTEGER NOT NULL" +
			             ")",
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
