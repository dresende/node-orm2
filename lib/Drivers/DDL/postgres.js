exports.sync = function (driver, opts, cb) {
	var queries = [];
	var definitions = [];
	var k, i, pending;

	definitions.push(driver.escapeId(opts.id) + " SERIAL");

	for (k in opts.properties) {
		switch (opts.properties[k].type) {
			case "text":
				definitions.push(driver.escapeId(k) + " VARCHAR(255)");
				break;
			case "number":
				definitions.push(driver.escapeId(k) + " REAL");
				break;
			case "boolean":
				definitions.push(driver.escapeId(k) + " BOOLEAN NOT NULL");
				break;
			case "date":
				definitions.push(driver.escapeId(k) + " TIMESTAMP WITHOUT TIME ZONE"); // hmm... I'm not sure..
				break;
			case "binary":
				definitions.push(driver.escapeId(k) + " BYTEA");
				break;
			default:
				throw new Error("Unknown property type: '" + opts.properties[k].type + "'");
		}
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		definitions.push(driver.escapeId(opts.one_associations[i].field) + " INTEGER UNSIGNED NOT NULL");
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
			driver.escapeId(opts.many_associations[i].mergeId) + " INTEGER UNSIGNED NOT NULL, " +
			driver.escapeId(opts.many_associations[i].mergeAssocId) + " INTEGER UNSIGNED NOT NULL" +
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
				return cb(err);
			}
		});
	}
};
