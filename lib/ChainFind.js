var _             = require("lodash");
var Utilities     = require("./Utilities");
var ChainInstance = require("./ChainInstance");
var Promise       = require("./Promise").Promise;

module.exports = ChainFind;

function ChainFind(Model, opts) {
	var prepareConditions = function () {
		return Utilities.transformPropertyNames(
			opts.conditions, opts.properties
		);
	};

	var prepareOrder = function () {
		return Utilities.transformOrderPropertyNames(
			opts.order, opts.properties
		);
	};

	var promise = null;
	var chain = {
		find: function () {
			var cb = null;

			var args = Array.prototype.slice.call(arguments);
			opts.conditions = opts.conditions || {};

			if (typeof _.last(args) === "function") {
			    cb = args.pop();
			}

			if (typeof args[0] === "object") {
				_.extend(opts.conditions, args[0]);
			} else if (typeof args[0] === "string") {
				opts.conditions.__sql = opts.conditions.__sql || [];
				opts.conditions.__sql.push(args);
			}

			if (cb) {
				return this.all(cb);
			}
			return this;
		},
		only: function () {
			if (arguments.length && Array.isArray(arguments[0])) {
				opts.only = arguments[0];
			} else {
				opts.only = Array.prototype.slice.apply(arguments);
			}
			return this;
		},
		omit: function () {
			var omit = null;

			if (arguments.length && Array.isArray(arguments[0])) {
				omit = arguments[0];
			} else {
				omit = Array.prototype.slice.apply(arguments);
			}
			this.only(_.difference(Object.keys(opts.properties), omit));
			return this;
		},
		limit: function (limit) {
			opts.limit = limit;
			return this;
		},
		skip: function (offset) {
			return this.offset(offset);
		},
		offset: function (offset) {
			opts.offset = offset;
			return this;
		},
		order: function (property, order) {
			if (!Array.isArray(opts.order)) {
				opts.order = [];
			}
			if (property[0] === "-") {
				opts.order.push([ property.substr(1), "Z" ]);
			} else {
				opts.order.push([ property, (order && order.toUpperCase() === "Z" ? "Z" : "A") ]);
			}
			return this;
		},
		orderRaw: function (str, args) {
			if (!Array.isArray(opts.order)) {
				opts.order = [];
			}
			opts.order.push([ str, args || [] ]);
			return this;
		},
		count: function (cb) {
			opts.driver.count(opts.table, prepareConditions(), {
				merge  : opts.merge
			}, function (err, data) {
				if (err || data.length === 0) {
					return cb(err);
				}
				return cb(null, data[0].c);
			});
			return this;
		},
		remove: function (cb) {
			var keys = _.map(opts.keyProperties, 'mapsTo');

			opts.driver.find(keys, opts.table, prepareConditions(), {
				limit  : opts.limit,
				order  : prepareOrder(),
				merge  : opts.merge,
				offset : opts.offset,
				exists : opts.exists
			}, function (err, data) {
				if (err) {
					return cb(err);
				}
				if (data.length === 0) {
					return cb(null);
				}

				var ids = [], conditions = {};
				var or;

				conditions.or = [];

				for (var i = 0; i < data.length; i++) {
					or = {};
					for (var j = 0; j < opts.keys.length; j++) {
						or[keys[j]] = data[i][keys[j]];
					}
					conditions.or.push(or);
				}

				return opts.driver.remove(opts.table, conditions, cb);
			});
			return this;
		},
		first: function (cb) {
			return this.run(function (err, items) {
				return cb(err, items && items.length > 0 ? items[0] : null);
			});
		},
		last: function (cb) {
			return this.run(function (err, items) {
				return cb(err, items && items.length > 0 ? items[items.length - 1] : null);
			});
		},
		each: function (cb) {
			return new ChainInstance(this, cb);
		},
		run: function (cb) {
			return this.all(cb);
		},
		success: function (cb) {
			if (!promise) {
				promise = new Promise();
				promise.handle(this.all);
			}
			return promise.success(cb);
		},
		fail: function (cb) {
			if (!promise) {
				promise = new Promise();
				promise.handle(this.all);
			}
			return promise.fail(cb);
		},
		eager: function () {
			// This will allow params such as ("abc", "def") or (["abc", "def"])
			var associations = _.flatten(arguments);

			// TODO: Implement eager loading for Mongo and delete this.
			if (opts.driver.config.protocol == "mongodb:") {
				throw new Error("MongoDB does not currently support eager loading");
			}

			opts.__eager = _.filter(opts.associations, function (association) {
				return ~associations.indexOf(association.name);
			});

			return this;
		},
		all: function (cb) {
			var order, conditions;

			conditions = Utilities.transformPropertyNames(
				opts.conditions, opts.properties
			);
			order = Utilities.transformOrderPropertyNames(
				opts.order, opts.properties
			);

			opts.driver.find(opts.only, opts.table, conditions, {
				limit  : opts.limit,
				order  : order,
				merge  : opts.merge,
				offset : opts.offset,
				exists : opts.exists
			}, function (err, data) {
				if (err) {
					return cb(err);
				}
				if (data.length === 0) {
					return cb(null, []);
				}
				var pending = data.length;

				var createInstance = function (idx) {
					opts.newInstance(data[idx], function (err, instance) {
						data[idx] = instance;

						if (--pending === 0) {
							return (opts.__eager && opts.__eager.length ? eagerLoading : cb)(null, data);
						}
					});
				};

				var eagerLoading = function (err, data) {
					var pending = opts.__eager.length;
					var idMap = {};
					var count = 0;

					var keys = _.map(data, function (instance) {
						var key = instance[opts.keys[0]];
						// Create the association arrays
						for (var i = 0, association; association = opts.__eager[i]; i++) {
							instance[association.name] = [];
						}

						idMap[key] = count++;
						return key;
					});

					_.map(opts.__eager, function (association) {
						opts.driver.eagerQuery(association, opts, keys, function (err, instances) {
							for (var i = 0, instance; instance = instances[i]; i++) {
								// Perform a parent lookup with $p, and initialize it as an instance.
								data[idMap[instance.$p]][association.name].push(association.model(instance));
							}

							if (--pending === 0) {
								return cb(null, data);
							}
						});
					});
				};

				for (var i = 0; i < data.length; i++) {
					createInstance(i);
				}
			});
			return this;
		}
	};
	chain.where = chain.find;

	if (opts.associations) {
		for (var i = 0; i < opts.associations.length; i++) {
			addChainMethod(chain, opts.associations[i], opts);
		}
	}
	for (var k in Model) {
		if ([
			"hasOne", "hasMany",
			"drop", "sync", "get", "find", "all", "count", "clear", "create",
			"exists", "settings", "aggregate"
		].indexOf(k) >= 0) {
			continue;
		}
		if (typeof Model[k] !== "function") {
			continue;
		}

		chain[k] = Model[k];
	}
	chain.model   = Model;
	chain.options = opts;

	return chain;
}

function addChainMethod(chain, association, opts) {
	chain[association.hasAccessor] = function (value) {
		if (!opts.exists) {
			opts.exists = [];
		}
		var conditions = {};

		var assocIds = Object.keys(association.mergeAssocId);
		var ids = association.model.id;
		function mergeConditions(source) {
			for (var i = 0; i < assocIds.length; i++) {
				if (typeof conditions[assocIds[i]] === "undefined") {
					conditions[assocIds[i]] = source[ids[i]];
				} else if (Array.isArray(conditions[assocIds[i]])) {
					conditions[assocIds[i]].push(source[ids[i]]);
				} else {
					conditions[assocIds[i]] = [ conditions[assocIds[i]], source[ids[i]] ];
				}
			}
		}

		if (Array.isArray(value)) {
			for (var i = 0; i < value.length; i++) {
				mergeConditions(value[i]);
			}
		} else {
			mergeConditions(value);
		}

		opts.exists.push({
			table      : association.mergeTable,
			link       : [ Object.keys(association.mergeId), association.model.id ],
			conditions : conditions
		});

		return chain;
	};
}
