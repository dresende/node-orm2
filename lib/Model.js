var Instance        = require("./Instance").Instance;
var Singleton       = require("./Singleton");
var OneAssociation  = require("./Associations/One");
var ManyAssociation = require("./Associations/Many");
var ChainFind       = require("./ChainFind");
var LazyLoad        = require("./LazyLoad");

exports.Model = Model;

function Model(opts) {
	opts = opts || {};
	opts.id = opts.id || "id";

	var one_associations = [];
	var many_associations = [];
	var association_properties = [];
	var model_fields = null;

	var model = function (data) {
		if (typeof data == "number") {
			var data2 = {};
			data2[opts.id] = data;

			var instance = new Instance({
				id                     : opts.id,
				data                   : data2,
				autoSave               : false,
				model                  : model,
				driver                 : opts.driver,
				table                  : opts.table,
				properties             : opts.properties,
				hooks                  : opts.hooks,
				methods                : opts.methods,
				validations            : opts.validations,
				association_properties : association_properties
			});
			if (model_fields !== null) {
				LazyLoad.extend(instance, model, opts.properties);
			}
			OneAssociation.extend(instance, opts.driver, one_associations, {
				autoFetch      : false
			}, function () {
				ManyAssociation.extend(instance, opts.driver, many_associations, {
					autoFetch      : false
				}, function () {
					// ..
				});
			});
			return instance;
		} else if (typeof data == "undefined") {
			data = {};
		}
		return new Instance({
			id                     : opts.id,
			is_new                 : !data.hasOwnProperty(opts.id),
			data                   : data,
			autoSave               : opts.autoSave,
			model                  : model,
			driver                 : opts.driver,
			table                  : opts.table,
			properties             : opts.properties,
			hooks                  : opts.hooks,
			methods                : opts.methods,
			validations            : opts.validations,
			association_properties : association_properties
		});
	};

	for (var k in opts.properties) {
		if (opts.properties[k].lazyload === true) {
			model_fields = [ opts.id ];
			for (k in opts.properties) {
				if (opts.properties[k].lazyload !== true) {
					model_fields.push(k);
				}
			}
			break;
		}
	}

	OneAssociation.prepare(model, one_associations, association_properties);
	ManyAssociation.prepare(model, many_associations);

	model.drop = function (cb) {
		if (typeof opts.driver.drop == "function") {
			opts.driver.drop({
				id                : opts.id,
				table             : opts.table,
				properties        : opts.properties,
				one_associations  : one_associations,
				many_associations : many_associations
			}, cb);

			return this;
		}

		return cb(new Error("Driver does not support Model.drop()"));
	};

	model.sync = function (cb) {
		if (typeof opts.driver.sync == "function") {
			opts.driver.sync({
				id                : opts.id,
				table             : opts.table,
				properties        : opts.properties,
				one_associations  : one_associations,
				many_associations : many_associations
			}, cb);

			return this;
		}

		return cb(new Error("Driver does not support Model.sync()"));
	};

	model.get = function (id, options, cb) {
		var conditions = {};
		conditions[opts.id] = id;

		if (typeof options == "function") {
			cb = options;
			options = {};
		} else {
			options = options || {};
		}

		if (typeof cb != "function") {
			throw new Error("Missing Model.get() callback");
		}

		if (!options.hasOwnProperty("cache")) {
			options.cache = opts.cache;
		}

		opts.driver.find(model_fields, opts.table, conditions, { limit: 1 }, function (err, data) {
			if (err) {
				return cb(err);
			}
			if (data.length === 0) {
				return cb(new Error("Not found"));
			}
			Singleton.get(opts.table + "/" + id, { cache: options.cache }, function (cb) {
				var instance = new Instance({
					id                     : opts.id,
					data                   : data[0],
					model                  : model,
					autoSave               : opts.autoSave,
					driver                 : opts.driver,
					table                  : opts.table,
					properties             : opts.properties,
					hooks                  : opts.hooks,
					methods                : opts.methods,
					validations            : opts.validations,
					association_properties : association_properties
				});
				if (model_fields !== null) {
					LazyLoad.extend(instance, model, opts.properties);
				}
				OneAssociation.extend(instance, opts.driver, one_associations, {
					autoFetch      : (options.autoFetchLimit === 0 ? false : opts.autoFetch),
					autoFetchLimit : options.autoFetchLimit || opts.autoFetchLimit
				}, function () {
					ManyAssociation.extend(instance, opts.driver, many_associations, {
						autoFetch      : (options.autoFetchLimit === 0 ? false : opts.autoFetch),
						autoFetchLimit : options.autoFetchLimit || opts.autoFetchLimit
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
			only       : options.only || model_fields,
			id         : opts.id,
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
						id                     : opts.id,
						data                   : data,
						extra                  : options.extra,
						extra_info             : options.extra_info,
						model                  : model,
						autoSave               : opts.autoSave,
						driver                 : opts.driver,
						table                  : opts.table,
						properties             : opts.properties,
						hooks                  : opts.hooks,
						methods                : opts.methods,
						validations            : opts.validations,
						association_properties : association_properties
					});
					if (model_fields !== null) {
						LazyLoad.extend(instance, model, opts.properties);
					}
					OneAssociation.extend(instance, opts.driver, one_associations, {
						autoFetch      : (options.autoFetchLimit === 0 ? false : opts.autoFetch),
						autoFetchLimit : options.autoFetchLimit
					}, function () {
						ManyAssociation.extend(instance, opts.driver, many_associations, {
							autoFetch      : (options.autoFetchLimit === 0 ? false : opts.autoFetch),
							autoFetchLimit : options.autoFetchLimit
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

	model.count = function () {
		var conditions = null;
		var cb         = null;

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "object":
					conditions = arguments[i];
					break;
				case "function":
					cb = arguments[i];
					break;
			}
		}

		if (typeof cb != "function") {
			throw new Error("Missing Model.count() callback");
		}

		opts.driver.count(opts.table, conditions, function (err, data) {
			if (err || data.length === 0) {
				return cb(err);
			}
			return cb(null, data[0].c);
		});
		return this;
	};

	model.exists = function (id, cb) {
		if (typeof cb != "function") {
			throw new Error("Missing Model.exists() callback");
		}

		var conditions = {};
		conditions[opts.id] = id;

		opts.driver.count(opts.table, conditions, function (err, data) {
			if (err || data.length === 0) {
				return cb(err);
			}
			return cb(null, data[0].c > 0);
		});
		return this;
	};

	model.create = function () {
		var Instances = [];
		var options = {};
		var cb = null, idx = 0;
		var createNext = function () {
			if (idx >= Instances.length) {
				return cb(null, Instances);
			}
			Instances[idx] = new Instance({
				id                     : opts.id,
				is_new                 : true,
				data                   : Instances[idx],
				model                  : model,
				autoSave               : opts.autoSave,
				driver                 : opts.driver,
				table                  : opts.table,
				properties             : opts.properties,
				hooks                  : opts.hooks,
				methods                : opts.methods,
				validations            : opts.validations,
				association_properties : association_properties
			});
			if (model_fields !== null) {
				LazyLoad.extend(Instances[idx], model, opts.properties);
			}
			Instances[idx].save(function (err) {
				if (err) {
					err.index = idx;
					err.instance = Instances[idx];

					return cb(err);
				}

				idx += 1;
				createNext();
			});
		};

		for (var i = 0; i < arguments.length; i++) {
			if (Array.isArray(arguments[i])) {
				Instances = Instances.concat(arguments[i]);
				continue;
			}

			switch (typeof arguments[i]) {
				case "object":
					options = arguments[i];
					break;
				case "function":
					cb = arguments[i];
					break;
			}
		}

		createNext();

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
