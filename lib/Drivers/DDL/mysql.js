exports.sync = function (driver, opts, cb) {
	var queries = [];
	var definitions = [];
	var k, i, pending;

	definitions.push(driver.escapeId(opts.id) + " INT(11) UNSIGNED NOT NULL AUTO_INCREMENT");

	for (k in opts.properties) {
		switch (opts.properties[k].type) {
			case "text":
				definitions.push(driver.escapeId(k) + " VARCHAR(255)");
				break;
			case "number":
				definitions.push(driver.escapeId(k) + " FLOAT");
				break;
			case "boolean":
				definitions.push(driver.escapeId(k) + " TINYINT(1) UNSIGNED NOT NULL");
				break;
			case "date":
				definitions.push(driver.escapeId(k) + " DATETIME");
				break;
			case "binary":
				definitions.push(driver.escapeId(k) + " BLOB");
				break;
			default:
				throw new Error("Unknown property type: '" + opts.properties[k].type + "'");
		}
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		definitions.push(driver.escapeId(opts.one_associations[i].field) + " INT(11) UNSIGNED NOT NULL");
	}

	definitions.push("INDEX (" + driver.escapeId(opts.id) + ")");
	for (i = 0; i < opts.one_associations.length; i++) {
		definitions.push("INDEX (" + driver.escapeId(opts.one_associations[i].field) + ")");
	}

	queries.push(
		"CREATE TABLE IF NOT EXISTS " + driver.escapeId(opts.table) +
		" (" + definitions.join(", ") + ")"
	);

	for (i = 0; i < opts.many_associations.length; i++) {
		queries.push(
			"CREATE TABLE IF NOT EXISTS " + driver.escapeId(opts.many_associations[i].mergeTable) +
			" (" +
			driver.escapeId(opts.many_associations[i].mergeId) + " INT(11) UNSIGNED NOT NULL, " +
			driver.escapeId(opts.many_associations[i].mergeAssocId) + " INT(11) UNSIGNED NOT NULL, " +
			"INDEX (" + driver.escapeId(opts.many_associations[i].mergeId) + ", " + driver.escapeId(opts.many_associations[i].mergeAssocId) + ")" +
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
