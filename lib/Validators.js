var enforce = require("enforce");
var util    = require("util");

var validators = {
	required       : enforce.required,
	notEmptyString : enforce.notEmptyString,

	rangeNumber    : enforce.ranges.number,
	rangeLength    : enforce.ranges.length,

	insideList     : enforce.lists.inside,
	outsideList    : enforce.lists.outside,

	password       : enforce.security.password,

	patterns       : enforce.patterns
};


/**
 * Check if a value is the same as a value
 * of another property (useful for password
 * checking).
 **/
validators.equalToProperty = function (name, msg) {
	return function (v, next, ctx) {
		if (v === this[name]) return next();
		return next(msg || 'not-equal-to-property');
	};
};

/**
 * Check if a property is unique in the collection.
 * This can take a while because a query has to be made against the Model.
 *
 * Due to the async nature of node, and concurrent web server environments,
 * an index on the database column is the only way to gurantee uniqueness.
 *
 * For sensibility's sake, undefined and null values are ignored for uniqueness
 * checks.
 *
 * Options:
 *   ignoreCase: for postgres; mysql ignores case by default.
 *   scope: (Array) scope uniqueness to listed properties
 **/
validators.unique = function () {
	var arg, k;
	var msg = null, opts = {};

	for (k in arguments) {
		arg = arguments[k];
		if (typeof arg === 'string') msg = arg;
		else if (typeof arg === 'object') opts = arg;
	}

	return function (v, next, ctx) {
	    var s, scopeProp;

	    if (typeof v === 'undefined' || v === null) return next();

        //Cannot process on database engines which don't support SQL syntax
	    if (!ctx.driver.isSql) return next('not-supported');

		var chain = ctx.model.find();

		var chainQuery = function (prop, value) {
			var query = null;

			if (opts.ignoreCase === true && ctx.model.properties[prop].type === 'text') {
				query = util.format('LOWER(%s.%s) LIKE LOWER(?)',
					ctx.model.table, ctx.driver.query.escapeId(prop)
				);
				chain.where(query, [value]);
			} else {
				query = {};
				query[prop] = value;
				chain.where(query);
			}
		};

		var handler = function (err, records) {
			if (err) {
				return next();
			}
			if (!records || records.length === 0) {
				return next();
			}
			if (records.length === 1 && records[0][ctx.model.id] === this[ctx.model.id]) {
				return next();
			}
			return next(msg || 'not-unique');
		}.bind(this);

		chainQuery(ctx.property, v);

		if (opts.scope) {
			for (s in opts.scope) {
				scopeProp = opts.scope[s];

				// In SQL unique index land, NULL values are not considered equal.
				if (typeof ctx.instance[scopeProp] == 'undefined' || ctx.instance[scopeProp] === null) {
					return next();
				}

				chainQuery(scopeProp, ctx.instance[scopeProp]);
			}
		}

		chain.all(handler);
	};
};

module.exports = validators;
