var enforce = require("enforce");


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
		if (v == this[name]) return next();
		return next(msg || 'not-equal-to-property');
	};
};

/**
 * Check if a property is unique in the collection.
 * This can take a while because a query has to be
 * made against the Model, but if you use this
 * always you should not have not unique values
 * on this property so this should not worry you.
 **/
validators.unique = function (msg) {
	return function (v, next, ctx) {
		var query = {};
		query[ctx.property] = v;

		ctx.model.find(query, function (err, records) {
			if (err) {
				return next();
			}
			if (!records || records.length === 0) {
				return next();
			}
			if (records.length == 1 && records[0][ctx.model.id] === this[ctx.model.id]) {
				return next();
			}
			return next(msg || 'not-unique');
		}.bind(this));
	};
};

module.exports = validators;
