var Singleton       = require("./Singleton");
var ChainInstance   = require("./ChainInstance");

module.exports = ChainFind;

function ChainFind(opts) {
	var chain = {
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
			opts.order.push([ property, (order && order.toUpperCase() == "Z" ? "Z" : "A") ]);
			return this;
		},
		count: function (cb) {
			opts.driver.count(opts.table, opts.conditions, opts, function (err, data) {
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
				return cb(err, items.length > 0 ? items[0] : null);
			});
		},
		last: function (cb) {
			return this.run(function (err, items) {
				return cb(err, items.length > 0 ? items[items.length - 1] : null);
			});
		},
		each: function (cb) {
			return new ChainInstance(this, cb);
		},
		run: function (cb) {
			return this.all(cb);
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

				for (var i = 0; i < data.length; i++) {
					(function (idx) {
						opts.newInstance(data[idx], function (err, instance) {
							data[idx] = instance;

							if (--pending === 0) {
								return cb(null, data);
							}
						});
					})(i);
				}
			});
			return this;
		}
	};
	if (opts.associations) {
		for (var i = 0; i < opts.associations.length; i++) {
			addChainMethod(chain, opts.associations[i], opts);
		}
	}
	return chain;
}

function addChainMethod(chain, association, opts) {
	chain[association.hasAccessor] = function (value) {
		if (!opts.exists) {
			opts.exists = [];
		}
		var conditions = {};

		conditions[association.mergeAssocId] = value;

		opts.exists.push({
			table      : association.mergeTable,
			link       : [ association.mergeId, association.model.id ],
			conditions : conditions
		});

		return chain;
	};
}
