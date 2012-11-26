/**
 * This is a supposed to be a list of common validators
 * that can be reused instead of creating new ones.
 **/
var validators = {};

/**
 * Check if a number is between a minimum and
 * a maximum number. One of this constraints
 * can be omitted.
 **/
validators.rangeNumber = function (min, max) {
	return function (n, next) {
		if (min === undefined && n <= max) return next();
		if (max === undefined && n >= min) return next();
		if (n >= min && n <= max) return next();
		return next('out-of-range-number');
	};
};

/**
 * Check if a string length is between a minimum
 * and a maximum number. One of this constraints
 * can be omitted.
 **/
validators.rangeLength = function (min, max) {
	return function (v, next) {
		if (v === undefined) return next('undefined');
		if (min === undefined && v.length <= max) return next();
		if (max === undefined && v.length >= min) return next();
		if (v.length >= min && v.length <= max) return next();
		return next('out-of-range-length');
	};
};

/**
 * Check if a value (number or string) is
 * in a list of values.
 **/
validators.insideList = function (list) {
	return function (v, next) {
		if (list.indexOf(v) >= 0) return next();
		return next('outside-list');
	};
};

/**
 * Check if a value (number or string) is
 * not in a list of values.
 **/
validators.outsideList = function (list) {
	return function (v, next) {
		if (list.indexOf(v) == -1) return next();
		return next('inside-list');
	};
};

/**
 * Check if a value is the same as a value
 * of another property (useful for password
 * checking).
 **/
validators.equalToProperty = function (name) {
	return function (v, next, data) {
		// could also do: v == this[name]
		if (v == data[name]) return next();
		return next('not-equal-to-property');
	};
};

/**
 * Check if a string has zero length. Sometimes
 * you might want to have a property on your
 * model that is not required but on a specific
 * form it can be.
 **/
validators.notEmptyString = function () {
	return validators.rangeLength(1);
};

/**
 * Check if a property is unique in the collection.
 * This can take a while because a query has to be
 * made against the Model, but if you use this
 * always you should not have not unique values
 * on this property so this should not worry you.
 **/
validators.unique = function () {
	return function (v, next, data, Model, prop) {
		var query = {};
		query[prop] = v;

		Model.find(query, function (records) {
			if (!records || records.length === 0) {
				return next();
			}
			if (records.length == 1 && records[0].id === data.id) {
				return next();
			}
			return next("not-unique");
		});
	};
};

/**
 * Pattern validators are usually based on regular
 * expressions and solve more complicated validations
 * you might need.
 **/
validators.patterns = {};

/**
 * Check if a value matches a given pattern.
 * You can define a pattern string and regex
 * modifiers or just send the RegExp object
 * as 1st argument.
 **/
validators.patterns.match = function (pattern, modifiers) {
	return function (v, next) {
		if (typeof pattern == "string") {
			pattern = new RegExp(pattern, modifiers);
		}
		if (typeof v == "string" && v.match(pattern)) return next();
		return next('no-pattern-match');
	};
};

/**
 * Check if a value is an hexadecimal string
 * (letters from A to F and numbers).
 **/
validators.patterns.hexString = function () {
	return validators.patterns.match("^[a-f0-9]+$", "i");
};

/**
 * Check if a value is an e-mail address
 * (simple checking, works 99%).
 **/
validators.patterns.email = function () {
	return validators.patterns.match("^[a-z0-9\\._%\\+\\-]+@[a-z0-9\\.\\-]+\\.[a-z]{2,6}$", "i");
};

/**
 * Check if it's a valid IPv4 address.
 **/
validators.patterns.ipv4 = function () {
	var part = "(1[0-9]{,2}|2[0-4][0-9]|25[0-4])";
	return validators.patterns.match("^" + [ part, part, part, part ].join("\\.") + "$", "");
};

module.exports = validators;
