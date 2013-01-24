exports.drop = function (driver, opts, cb) {
	var queries = [], pending;

	queries.push("DROP TABLE IF EXISTS " + driver.escapeId(opts.table));

	for (i = 0; i < opts.many_associations.length; i++) {
		queries.push("DROP TABLE IF EXISTS " + driver.escapeId(opts.many_associations[i].mergeTable));
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

	definitions.push(driver.escapeId(opts.id) + " INTEGER PRIMARY KEY AUTOINCREMENT");

	for (k in opts.properties) {
		switch (opts.properties[k].type) {
			case "text":
				definitions.push(driver.escapeId(k) + " TEXT");
				break;
			case "number":
				definitions.push(driver.escapeId(k) + " REAL");
				break;
			case "boolean":
				definitions.push(driver.escapeId(k) + " INTEGER UNSIGNED NOT NULL");
				break;
			case "date":
				definitions.push(driver.escapeId(k) + " DATETIME");
				break;
			case "binary":
				definitions.push(driver.escapeId(k) + " BLOB");
				break;
			case "enum":
				definitions.push(driver.escapeId(k) + " INTEGER");
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
	for (k in opts.properties) {
		if (opts.properties[k].unique === true) {
			queries.push(
				"CREATE UNIQUE INDEX IF NOT EXISTS " + driver.escapeId(k) +
				" ON " + driver.escapeId(opts.table) +
				" (" + driver.escapeId(k) + ")"
			);
		}
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		queries.push(
			"CREATE INDEX IF NOT EXISTS " + driver.escapeId(opts.table + "_" + opts.one_associations[i].field) +
			" ON " + driver.escapeId(opts.table) +
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
			"CREATE INDEX IF NOT EXISTS " + driver.escapeId(opts.many_associations[i].mergeTable) +
			" ON " + driver.escapeId(opts.table) +
			" (" + driver.escapeId(opts.many_associations[i].mergeId) + ", " + driver.escapeId(opts.many_associations[i].mergeAssocId) + ")"
		);
	}

	pending = queries.length;
	for (i = 0; i < queries.length; i++) {
		driver.db.all(queries[i], function (err) {
			console.log(err);
			if (--pending === 0) {
				return cb(err);
			}
		});
	}
};
