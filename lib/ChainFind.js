var Singleton       = require("./Singleton");

module.exports = ChainFind;

function ChainFind(opts) {
	return {
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
			opts.order = [ property, order ];
			return this;
		},
		run: function (cb) {
			opts.driver.find(opts.only, opts.table, opts.conditions, {
				limit  : opts.limit,
				order  : opts.order,
				merge  : opts.merge,
				offset : opts.offset
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

							pending -= 1;

							if (pending === 0) {
								return cb(null, data);
							}
						});
					})(i);
				}
			});
			return this;
		}
	};
}
