exports.drop = function (driver, opts, cb) {
	var i, queries = [], pending;

	queries.push("DROP TABLE IF EXISTS " + driver.query.escapeId(opts.table));

	for (i = 0; i < opts.many_associations.length; i++) {
		queries.push("DROP TABLE IF EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable));
	}

	pending = queries.length;

	if (driver.opts.pool) {
		return driver.db.pool.getConnection(function (err, db) {
			for (i = 0; i < queries.length; i++) {
				db.query(queries[i], function (err) {
					if (--pending === 0) {
						return cb(err);
					}
				});
			}
		});
	}

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
	var k, i, pending;

	definitions.push(driver.query.escapeId(opts.id) + " INT(11) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY");

	for (k in opts.properties) {
		definitions.push(buildColumnDefinition(driver, k, opts.properties[k]));
	}

	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].reversed) continue;
		definitions.push(driver.query.escapeId(opts.one_associations[i].field) + " INT(11) UNSIGNED NOT NULL");
	}

	definitions.push("INDEX (" + driver.query.escapeId(opts.id) + ")");
	for (k in opts.properties) {
		if (opts.properties[k].unique === true) {
			definitions.push("UNIQUE KEY " + driver.query.escapeId(k) + " (" + driver.query.escapeId(k) + ")");
		}
	}
	for (i = 0; i < opts.one_associations.length; i++) {
		if (opts.one_associations[i].reversed) continue;
		definitions.push("INDEX (" + driver.query.escapeId(opts.one_associations[i].field) + ")");
	}

	queries.push(
		"CREATE TABLE IF NOT EXISTS " + driver.query.escapeId(opts.table) +
		" (" + definitions.join(", ") + ")"
	);

	for (i = 0; i < opts.many_associations.length; i++) {
		definitions = [];

		definitions.push(driver.query.escapeId(opts.many_associations[i].mergeId) + " INT(11) UNSIGNED NOT NULL");
		definitions.push(driver.query.escapeId(opts.many_associations[i].mergeAssocId) + " INT(11) UNSIGNED NOT NULL");

		for (k in opts.many_associations[i].props) {
			definitions.push(buildColumnDefinition(driver, k, opts.many_associations[i].props[k]));
		}

		definitions.push("INDEX (" + driver.query.escapeId(opts.many_associations[i].mergeId) + ", " + driver.query.escapeId(opts.many_associations[i].mergeAssocId) + ")");
		queries.push(
			"CREATE TABLE IF NOT EXISTS " + driver.query.escapeId(opts.many_associations[i].mergeTable) +
			" (" + definitions.join(", ") + ")"
		);
	}

	pending = queries.length;

	if (driver.opts.pool) {
		return driver.db.pool.getConnection(function (err, db) {
			for (i = 0; i < queries.length; i++) {
				db.query(queries[i], function (err) {
					if (--pending === 0) {
						return cb(err);
					}
				});
			}
		});
	}

	for (i = 0; i < queries.length; i++) {
		driver.db.query(queries[i], function (err) {
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
			def = driver.query.escapeId(name) + " VARCHAR(" + Math.min(Math.max(parseInt(prop.size, 10) || 255, 1), 65535) + ")";
			break;
		case "number":
			if (prop.rational === false) {
				def = driver.query.escapeId(name) + " INTEGER";
			} else {
				def = driver.query.escapeId(name) + " FLOAT";
			}
			if (prop.unsigned === true) {
				def += " UNSIGNED";
			}
			break;
		case "boolean":
			def = driver.query.escapeId(name) + " BOOLEAN NOT NULL";
			break;
		case "date":
			if (prop.time === false) {
				def = driver.query.escapeId(name) + " DATE";
			} else {
				def = driver.query.escapeId(name) + " DATETIME";
			}
			break;
		case "binary":
			if (prop.big === true) {
				def = driver.query.escapeId(name) + " LONGBLOB";
			} else {
				def = driver.query.escapeId(name) + " BLOB";
			}
			break;
		case "enum":
			def = driver.query.escapeId(name) + " ENUM (" +
			       prop.values.map(driver.db.escape.bind(driver.db)) +
			")";
			break;
		default:
			throw new Error("Unknown property type: '" + prop.type + "'");
	}
	if (prop.hasOwnProperty("defaultValue")) {
		def += " DEFAULT " + driver.db.escape(prop.defaultValue);
	}
	return def;
}
