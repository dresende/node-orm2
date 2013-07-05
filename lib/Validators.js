/**
 * This is supposed to be a list of common validators
 * that can be reused instead of creating new ones.
 **/
var validators = {};


/**
 * Make sure the property isn't `NULL` or `undefined`.
 * Note: 0 and '' will be considered valid.
 **/
validators.required = function (msg) {
	return function (v, next) {
		if(v === null || v === undefined) return next(msg || 'required')
		else return next();
	};
};

/**
 * Check if a number is between a minimum and
 * a maximum number. One of this constraints
 * can be omitted.
 **/
validators.rangeNumber = function (min, max, msg) {
	return function (n, next) {
		if (min === undefined && n <= max) return next();
		if (max === undefined && n >= min) return next();
		if (n === undefined || n === null) return next('undefined');
		if (n >= min && n <= max) return next();
		return next(msg || 'out-of-range-number');
	};
};

/**
 * Check if a string length is between a minimum
 * and a maximum number. One of this constraints
 * can be omitted.
 **/
validators.rangeLength = function (min, max, msg) {
	return function (v, next) {
		if (v === undefined || v === null) return next('undefined');
		if (min === undefined && v.length <= max) return next();
		if (max === undefined && v.length >= min) return next();
		if (v.length >= min && v.length <= max) return next();
		return next(msg || 'out-of-range-length');
	};
};

/**
 * Check if a value (number or string) is
 * in a list of values.
 **/
validators.insideList = function (list, msg) {
	return function (v, next) {
		if (list.indexOf(v) >= 0) return next();
		return next(msg || 'outside-list');
	};
};

/**
 * Check if a value (number or string) is
 * not in a list of values.
 **/
validators.outsideList = function (list, msg) {
	return function (v, next) {
		if (list.indexOf(v) == -1) return next();
		return next(msg || 'inside-list');
	};
};

/**
 * Check if a value is the same as a value
 * of another property (useful for password
 * checking).
 **/
validators.equalToProperty = function (name, msg) {
	return function (v, next, data) {
		// could also do: v == this[name]
		if (v == data[name]) return next();
		return next(msg || 'not-equal-to-property');
	};
};

/**
 * Check if a string has zero length. Sometimes
 * you might want to have a property on your
 * model that is not required but on a specific
 * form it can be.
 **/
validators.notEmptyString = function (msg) {
	return validators.rangeLength(1, undefined, msg || 'empty-string');
};

/**
 * Check if a property is unique in the collection.
 * This can take a while because a query has to be
 * made against the Model, but if you use this
 * always you should not have not unique values
 * on this property so this should not worry you.
 **/
validators.unique = function (msg) {
	return function (v, next, data, Model, property) {
		var query = {};
		query[property] = v;

		Model.find(query, function (err, records) {
			if (err) {
				return next();
			}
			if (!records || records.length === 0) {
				return next();
			}
			if (records.length == 1 && records[0][Model.id] === data[Model.id]) {
				return next();
			}
			return next(msg || 'not-unique');
		});
	};
};

validators.password = function (checks, msg) {
	if (!msg) {
		msg    = checks;
		checks = "luns6"; // (l)owercase, (u)ppercase, (n)umber, (s)pecial characters, (6) min length
	}
	if (!msg) {
		msg    = "weak-password";
	}
	var m = checks.match(/([0-9]+)/);
	var min_len = (m ? parseInt(m[1], 10) : null);

	return function (v, next) {
		if (!v) return next(msg);

		if (checks.indexOf("l") >= 0 && !v.match(/[a-z]/)) return next(msg);
		if (checks.indexOf("u") >= 0 && !v.match(/[A-Z]/)) return next(msg);
		if (checks.indexOf("n") >= 0 && !v.match(/[0-9]/)) return next(msg);
		if (checks.indexOf("s") >= 0 && !v.match(/[^a-zA-Z0-9]/)) return next(msg);
		if (min_len !== null && min_len > v.length) return next(msg);

		return next();
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
validators.patterns.match = function (pattern, modifiers, msg) {
	if (typeof pattern == "string") {
		pattern = new RegExp(pattern, modifiers);
	}
	return function (v, next) {
		if (typeof v == "string" && v.match(pattern)) return next();
		return next(msg || 'no-pattern-match');
	};
};

/**
 * Check if a value is an hexadecimal string
 * (letters from A to F and numbers).
 **/
validators.patterns.hexString = function (msg) {
	return validators.patterns.match("^[a-f0-9]+$", "i", msg);
};

/**
 * Check if a value is an e-mail address
 * (simple checking, works 99%).
 **/
validators.patterns.email = function (msg) {
	return validators.patterns.match("^[a-z0-9\\._%\\+\\-]+@[a-z0-9\\.\\-]+\\.[a-z]{2,6}$", "i", msg);
};

/**
 * Check if it's a valid IPv4 address.
 **/
validators.patterns.ipv4 = function (msg) {
	var p1 = "([1-9]|1[0-9][0-9]?|2[0-4][0-9]|25[0-4])";
	var p2 = "([0-9]|1[0-9][0-9]?|2[0-4][0-9]|25[0-4])";
	return validators.patterns.match("^" + [ p1, p2, p2, p1 ].join("\\.") + "$", "", msg);
};

module.exports = validators;
