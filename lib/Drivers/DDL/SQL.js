var _    = require("lodash");
var Sync = require("sql-ddl-sync").Sync;

exports.sync = function (opts, cb) {
	var sync = new Sync({
		driver  : this,
		debug   : false//function (text) { console.log(text); }
	});

	var setIndex = function (p, v, k) {
		v.index = true;
		p[k] = v;
	};
	var props = {};

	if (this.customTypes) {
		for (var k in this.customTypes) {
			sync.defineType(k, this.customTypes[k]);
		}
	}
	for (var k in opts.allProperties) {
		if (typeof opts.id == "string" && opts.id == k) {
			opts.allProperties[k].index = [ opts.table + "_pkey" ];
		} else if (Array.isArray(opts.id) && opts.id.indexOf(k) >= 0) {
			opts.allProperties[k].index = [ opts.table + "_pkey" ];
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

	return this;
};

exports.drop = function (opts, cb) {
	var i, queries = [], pending;

	queries.push("DROP TABLE IF EXISTS " + this.query.escapeId(opts.table));

	for (i = 0; i < opts.many_associations.length; i++) {
		queries.push("DROP TABLE IF EXISTS " + this.query.escapeId(opts.many_associations[i].mergeTable));
	}

	pending = queries.length;

	for (i = 0; i < queries.length; i++) {
		this.execQuery(queries[i], function (err) {
			if (--pending === 0) {
				return cb(err);
			}
		});
	}

	return this;
};
