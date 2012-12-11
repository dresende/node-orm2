var Instance        = require("./Instance").Instance;
var Singleton       = require("./Singleton");
var OneAssociation  = require("./Associations/One");
var ManyAssociation = require("./Associations/Many");
var ChainFind       = require("./ChainFind");

exports.Model = Model;

function Model(opts) {
	opts = opts || {};
	opts.id = opts.id || "id";

	var one_associations = [];
	var many_associations = [];
	var association_properties = [];

	var model = function (data) {
		return new Instance({
			data                   : data,
			autoSave               : opts.autoSave,
			driver                 : opts.driver,
			table                  : opts.table,
			properties             : opts.properties,
			hooks                  : opts.hooks,
			methods                : opts.methods,
			validations            : opts.validations,
			association_properties : association_properties
		});
	};

	OneAssociation.prepare(model, one_associations, association_properties);
	ManyAssociation.prepare(model, many_associations);

	model.get = function (id, options, cb) {
		var conditions = {};
		conditions[opts.id] = id;

		if (typeof options == "function") {
			cb = options;
			options = {};
		} else {
			options = options || {};
		}

		if (!options.hasOwnProperty("cache")) {
			options.cache = opts.cache;
		}

		opts.driver.find(null, opts.table, conditions, { limit: 1 }, function (err, data) {
			if (err) {
				return cb(err);
			}
			if (data.length === 0) {
				return cb(new Error("Not found"));
			}
			Singleton.get(opts.table + "/" + id, { cache: options.cache }, function (cb) {
				var instance = new Instance({
					data                   : data[0],
					autoSave               : opts.autoSave,
					driver                 : opts.driver,
					table                  : opts.table,
					properties             : opts.properties,
					hooks                  : opts.hooks,
					methods                : opts.methods,
					validations            : opts.validations,
					association_properties : association_properties
				});
				OneAssociation.extend(instance, opts.driver, one_associations, {
					autoFetch : opts.autoFetch
				}, function () {
					ManyAssociation.extend(instance, opts.driver, many_associations, {
						autoFetch : opts.autoFetch
					}, function () {
						return cb(instance);
					});
				});
			}, function (instance) {
				return cb(null, instance);
			});
		});

		return this;
	};

	model.find = function () {
		var options    = {};
		var conditions = null;
		var cb         = null;
		var limit      = null;
		var order      = null;
		var merge      = null;

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "number":
					limit = arguments[i];
					break;
				case "object":
					if (Array.isArray(arguments[i])) {
						if (order.length > 0) {
							order = arguments[i];
						}
					} else {
						if (conditions === null) {
							conditions = arguments[i];
						} else {
							options = arguments[i];
							if (options.hasOwnProperty("__merge")) {
								merge = options.__merge;
								delete options.__merge;
							}
						}
					}
					break;
				case "function":
					cb = arguments[i];
					break;
				case "string":
					order = [ arguments[i] ];
					break;
			}
		}

		if (!options.hasOwnProperty("cache")) {
			options.cache = opts.cache;
		}

		var chain = new ChainFind({
			only       : options.only || null,
			table      : opts.table,
			driver     : opts.driver,
			conditions : conditions,
			limit      : limit,
			order      : order,
			merge      : merge,
			offset     : options.offset,
			newInstance: function (data, cb) {
				Singleton.get(opts.table + (merge ? "+" + merge.from.table : "") + "/" + data[opts.id],
				              { cache: options.cache },
				function (cb) {
					var instance = new Instance({
						data                   : data,
						extra                  : options.extra,
						extra_info             : options.extra_info,
						autoSave               : opts.autoSave,
						driver                 : opts.driver,
						table                  : opts.table,
						properties             : opts.properties,
						hooks                  : opts.hooks,
						methods                : opts.methods,
						validations            : opts.validations,
						association_properties : association_properties
					});
					OneAssociation.extend(instance, opts.driver, one_associations, {
						autoFetch : opts.autoFetch
					}, function () {
						ManyAssociation.extend(instance, opts.driver, many_associations, {
							autoFetch : opts.autoFetch
						}, function () {
							return cb(instance);
						});
					});
				}, function (instance) {
					return cb(null, instance);
				});
			}
		});
		if (cb === null) {
			return chain;
		}

		chain.run(cb);

		return this;
	};

	model.clear = function (cb) {
		opts.driver.clear(opts.table, function (err) {
			if (typeof cb == "function") cb(err);
		});

		return this;
	};

	Object.defineProperty(model, "table", {
		value: opts.table,
		enumerable: false
	});
	Object.defineProperty(model, "id", {
		value: opts.id,
		enumerable: false
	});

	return model;
}
