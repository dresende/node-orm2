module.exports = AggregateFunctions;

function AggregateFunctions(opts) {
	if (typeof opts.driver.getQuery != "function") {
		throw new Error("This driver does not support aggregate functions");
	}
	if (!Array.isArray(opts.driver.aggregate_functions)) {
		throw new Error("This driver does not support aggregate functions");
	}

	var aggregates = [ [] ];
	var group_by   = null;

	var appendFunction = function (fun) {
		return function () {
			var args = (arguments.length && Array.isArray(arguments[0]) ? arguments[0] : Array.prototype.slice.apply(arguments));

			if (args.length > 0) {
				aggregates[aggregates.length - 1].push({ f: fun, a: args });
				aggregates.push([]);
			} else {
				aggregates[aggregates.length - 1].push({ f: fun });
			}

			return proto;
		};
	};
	var proto = {
		groupBy: function () {
			group_by = Array.prototype.slice.apply(arguments);
			return this;
		},
		get: function (cb) {
			if (typeof cb != "function") {
				throw new Error("You must pass a callback to Model.aggregate().get()");
			}
			if (aggregates[aggregates.length - 1].length === 0) {
				aggregates.length -= 1;
			}
			if (aggregates.length === 0) {
				throw new Error("Missing aggregate functions");
			}

			var query = opts.driver.getQuery().select().from(opts.table);

			for (var i = 0; i < aggregates.length; i++) {
				for (var j = 0; j < aggregates[i].length; j++) {
					query[aggregates[i][j].f](aggregates[i][j].a, 'aggregate' + i);
				}
			}

			query.where(opts.conditions);

			if (group_by !== null) {
				query.groupBy.apply(query, group_by);
			}

			console.log(query.build());

			opts.driver.execQuery(query.build(), function (err, data) {
				if (err) {
					return cb(err);
				}

				if (group_by !== null) {
					return cb(null, data);
				}

				var items = [];

				for (var i = 0; i < aggregates.length; i++) {
					items.push(data[0]['aggregate' + i] || null);
				}

				items.unshift(null);

				return cb.apply(null, items);
			});
		}
	};

	for (var i = 0; i < opts.driver.aggregate_functions.length; i++) {
		addAggregate(proto, opts.driver.aggregate_functions[i], appendFunction);
	}

	return proto;
}

function addAggregate(proto, fun, builder) {
	if (Array.isArray(fun)) {
		proto[fun[0].toLowerCase()] = builder((fun[1] || fun[0]).toLowerCase());
	} else {
		proto[fun.toLowerCase()] = builder(fun.toLowerCase());
	}
}
