var _               = require("lodash");
var Singleton       = require("./Singleton");
var ChainInstance   = require("./ChainInstance");
var Promise         = require("./Promise").Promise;

module.exports = ChainFind;

function ChainFind(Model, opts) {
	var promise = null;
	var chain = {
		find: function () {
			var cb = null;

			var args = Array.prototype.slice.call(arguments);
			opts.conditions = opts.conditions || {};

			if (typeof _.last(args) === 'function') {
			    cb = args.pop();
			}

			if (typeof args[0] === 'object') {
			    _.extend(opts.conditions, args[0]);
			} else if (typeof args[0] === 'string') {
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
			opts.driver.count(opts.table, opts.conditions, {}, function (err, data) {
				if (err || data.length === 0) {
					return cb(err);
				}
				return cb(null, data[0].c);
			});
			return this;
		},
		remove: function (cb) {
			opts.driver.find([ opts.id ], opts.table, opts.conditions, {
				limit  : opts.limit,
				order  : opts.order,
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

				for (var i = 0; i < data.length; i++) {
					ids.push(data[i][opts.id]);
				}

				conditions[opts.id] = ids;

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
		all: function (cb) {
			opts.driver.find(opts.only, opts.table, opts.conditions, {
				limit  : opts.limit,
				order  : opts.order,
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
				            return cb(null, data);
				        }
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
		if ([ "hasOne", "hasMany",
		      "drop", "sync", "get", "find", "all", "count", "clear", "create",
		      "exists", "settings", "aggregate" ].indexOf(k) >= 0) continue;
		if (typeof Model[k] !== "function") continue;

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
		        if (typeof conditions[assocIds[i]] === 'undefined')
		            conditions[assocIds[i]] = source[ids[i]];
		        else if(Array.isArray(conditions[assocIds[i]]))
		            conditions[assocIds[i]].push(source[ids[i]]);
		        else
		            conditions[assocIds[i]] = [conditions[assocIds[i]], source[ids[i]]];
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
