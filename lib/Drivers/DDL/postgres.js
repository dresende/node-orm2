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
	var queries = [];
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
				queries.push(
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

	queries.push(
		"CREATE TABLE IF NOT EXISTS " + driver.escapeId(opts.table) +
		" (" + definitions.join(", ") + ")"
	);
	queries.push(
		"CREATE INDEX ON " + driver.escapeId(opts.table) +
		" (" + driver.escapeId(opts.id) + ")"
	);

	for (i = 0; i < opts.one_associations.length; i++) {
		queries.push(
			"CREATE INDEX ON " + driver.escapeId(opts.table) +
			" (" + driver.escapeId(opts.one_associations[i].field) + ")"
		);
	}

	for (i = 0; i < opts.many_associations.length; i++) {
		queries.push(
			"CREATE TABLE IF NOT EXISTS " + driver.escapeId(opts.many_associations[i].mergeTable) +
			" (" +
			driver.escapeId(opts.many_associations[i].mergeId) + " INTEGER NOT NULL, " +
			driver.escapeId(opts.many_associations[i].mergeAssocId) + " INTEGER NOT NULL" +
			")"
		);
		queries.push(
			"CREATE INDEX ON " + driver.escapeId(opts.many_associations[i].mergeTable) +
			" (" +
			driver.escapeId(opts.many_associations[i].mergeId) + ", " +
			driver.escapeId(opts.many_associations[i].mergeAssocId) +
			")"
		);
	}

	pending = queries.length;
	for (i = 0; i < queries.length; i++) {
		driver.db.query(queries[i], function (err) {
			if (--pending === 0) {
				// this will bring trouble in the future...
				// some errors are not avoided (like ENUM types already defined, etc..)
				return cb(err);
			}
		});
	}
};
