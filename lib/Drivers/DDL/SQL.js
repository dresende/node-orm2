var _    = require("lodash");
var Sync = require("sql-ddl-sync").Sync;

exports.sync = function (dialect, driver, opts, cb) {
	var sync = new Sync({
		dialect : dialect,
		db      : driver.db,
		debug   : false//function (text) { console.log(text); }
	});

	var setIndex = function (p, v, k) {
		v.index = true;
		p[k] = v;
	};
	var props = {};

	if (driver.customTypes) {
		for (var k in driver.customTypes) {
			sync.defineType(k, driver.customTypes[k]);
		}
	}
	for (var k in opts.allProperties) {
		if (typeof opts.id == "string" && opts.id == k) {
			opts.allProperties[k].index = [ opts.table + "_pkey" ];
			opts.allProperties[k].primary = true;
		} else if (Array.isArray(opts.id) && opts.id.indexOf(k) >= 0) {
			opts.allProperties[k].index = [ opts.table + "_pkey" ];
			opts.allProperties[k].primary = true;
		}
	}

	sync.defineCollection(opts.table, opts.allProperties);

	for (i = 0; i < opts.many_associations.length; i++) {
		props = {};

		_.merge(props, opts.many_associations[i].mergeId);
		_.merge(props, opts.many_associations[i].mergeAssocId);
		props = _.transform(props, setIndex);
		_.merge(props, opts.many_associations[i].props);

		sync.defineCollection(opts.many_associations[i].mergeTable, props);
	}

	sync.sync(cb);
};

exports.drop = function (dialect, driver, opts, cb) {
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
