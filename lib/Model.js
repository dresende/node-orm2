var Instance        = require("./Instance").Instance;
var Singleton       = require("./Singleton");
var OneAssociation  = require("./Associations/One");
var ManyAssociation = require("./Associations/Many");
var ChainFind       = require("./ChainFind");
var LazyLoad        = require("./LazyLoad");
var Utilities       = require("./Utilities");

exports.Model = Model;

function Model(opts) {
	opts = opts || {};

	if (!Array.isArray(opts.keys) || opts.keys.length < 2) {
		opts.keys = [ opts.id ];
	} else {
		opts.id = null;
	}

	var one_associations = [];
	var many_associations = [];
	var association_properties = [];
	var model_fields = [];

	for (var i = 0; i < opts.keys.length; i++) {
		model_fields.push(opts.keys[i]);
	}

	var createInstance = function (data, inst_opts, cb) {
		if (!inst_opts) {
			inst_opts = {};
		}
		var instance = new Instance({
			id                     : opts.id,
			keys                   : opts.keys,
			is_new                 : inst_opts.is_new || false,
			data                   : data,
			autoSave               : inst_opts.autoSave || false,
			extra                  : inst_opts.extra,
			extra_info             : inst_opts.extra_info,
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
		OneAssociation.extend(model, instance, opts.driver, one_associations, {
			autoFetch      : inst_opts.autoFetch || false,
			autoFetchLimit : inst_opts.autoFetchLimit,
			cascadeRemove  : inst_opts.cascadeRemove
		}, function () {
			ManyAssociation.extend(model, instance, opts.driver, many_associations, {
				autoFetch      : inst_opts.autoFetch || false,
				autoFetchLimit : inst_opts.autoFetchLimit,
				cascadeRemove  : inst_opts.cascadeRemove
			}, function () {
				if (typeof cb == "function") {
					return cb(instance);
				}
			});
		});
		return instance;
	};

	var model = function (data) {
		var instance;
		if (typeof data == "number") {
			var data2 = {};
			data2[opts.id] = data;

			return createInstance(data2);
		} else if (typeof data == "undefined") {
			data = {};
		}

		return createInstance(data, {
			is_new        : !data.hasOwnProperty(opts.id),
			autoSave      : opts.autoSave,
			cascadeRemove : opts.cascadeRemove
		});
	};

	for (var k in opts.properties) {
		if (opts.properties[k].lazyload !== true) {
			model_fields.push(k);
		}
	}

	model.settings = opts.settings;

	model.drop = function (cb) {
		if (arguments.length === 0) {
			cb = function () {};
		}
		if (typeof opts.driver.drop == "function") {
			opts.driver.drop({
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
		if (arguments.length === 0) {
			cb = function () {};
		}
		if (typeof opts.driver.sync == "function") {
			opts.driver.sync({
				keys              : opts.keys,
				table             : opts.table,
				properties        : opts.properties,
				indexes           : opts.indexes || [],
				one_associations  : one_associations,
				many_associations : many_associations
			}, cb);

			return this;
		}

		return cb(new Error("Driver does not support Model.sync()"));
	};

	model.get = function () {
		var conditions = {};
		var options    = {};
		var ids        = Array.prototype.slice.apply(arguments);
		var cb         = ids.pop();

		if (typeof cb != "function") {
			throw new Error("Missing Model.get() callback");
		}

		if (typeof ids[ids.length - 1] == "object") {
			options = ids.pop();
		}

		if (ids.length == 1 && Array.isArray(ids[0])) {
			ids = ids[0];
		}

		if (ids.length != opts.keys.length) {
			throw new Error("Model.get() IDs number missmatch (" + opts.keys.length + " needed, " + ids.length + " passed)");
		}

		for (var i = 0; i < opts.keys.length; i++) {
			conditions[opts.keys[i]] = ids[i];
		}

		opts.driver.find(model_fields, opts.table, conditions, { limit: 1 }, function (err, data) {
			if (err) {
				return cb(err);
			}
			if (data.length === 0) {
				return cb(new Error("Not found"));
			}
			Singleton.get(opts.driver.uid + "/" + opts.table + "/" + ids.join("."), {
				cache      : options.cache || opts.cache,
				save_check : opts.settings.get("instance.cacheSaveCheck")
			}, function (cb) {
				return createInstance(data[0], {
					autoSave       : opts.autoSave,
					autoFetch      : (options.autoFetchLimit === 0 ? false : opts.autoFetch),
					autoFetchLimit : options.autoFetchLimit || opts.autoFetchLimit,
					cascadeRemove  : options.cascadeRemove || opts.cascadeRemove
				}, cb);
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
		var order      = null;
		var merge      = null;

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "number":
					options.limit = arguments[i];
					break;
				case "object":
					if (Array.isArray(arguments[i])) {
						if (arguments[i].length > 0) {
							order = arguments[i];
						}
					} else {
						if (conditions === null) {
							conditions = arguments[i];
						} else {
							if (options.hasOwnProperty("limit")) {
								arguments[i].limit = options.limit;
							}
							options = arguments[i];

							if (options.hasOwnProperty("__merge")) {
								merge = options.__merge;
								merge.select = Object.keys(options.extra);
								delete options.__merge;
							}
							if (options.hasOwnProperty("order")) {
								order = options.order;
								delete options.order;
							}
						}
					}
					break;
				case "function":
					cb = arguments[i];
					break;
				case "string":
					if (arguments[i][0] == "-") {
						order = [ arguments[i].substr(1), "Z" ];
					} else {
						order = [ arguments[i] ];
					}
					break;
			}
		}

		if (!options.hasOwnProperty("cache")) {
			options.cache = opts.cache;
		}

		if (order) {
			order = Utilities.standardizeOrder(order);
		}

		var chain = new ChainFind(model, {
			only         : options.only || model_fields,
			id           : opts.id,
			table        : opts.table,
			driver       : opts.driver,
			conditions   : conditions,
			associations : many_associations,
			limit        : options.limit,
			order        : order,
			merge        : merge,
			offset       : options.offset,
			newInstance  : function (data, cb) {
				Singleton.get(opts.driver.uid + "/" + opts.table + (merge ? "+" + merge.from.table : "") + "/" + data[opts.id], {
					cache      : options.cache,
					save_check : opts.settings.get("instance.cacheSaveCheck")
				}, function (cb) {
					return createInstance(data, {
						autoSave       : opts.autoSave,
						autoFetch      : (options.autoFetchLimit === 0 ? false : (options.autoFetch || opts.autoFetch)),
						autoFetchLimit : options.autoFetchLimit || opts.autoFetchLimit,
						cascadeRemove  : options.cascadeRemove || opts.cascadeRemove,
						extra          : options.extra,
						extra_info     : options.extra_info
					}, cb);
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

	model.all = model.find;

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

		opts.driver.count(opts.table, conditions, {}, function (err, data) {
			if (err || data.length === 0) {
				return cb(err);
			}
			return cb(null, data[0].c);
		});
		return this;
	};

	model.aggregate = function () {
		var conditions = {};
		var properties = [];

		for (var i = 0; i < arguments.length; i++) {
			if (typeof arguments[i] == "object") {
				if (Array.isArray(arguments[i])) {
					properties = arguments[i];
				} else {
					conditions = arguments[i];
				}
			}
		}

		return new require("./AggregateFunctions")({
			table      : opts.table,
			driver     : opts.driver,
			conditions : conditions,
			properties : properties
		});
	};

	model.exists = function () {
		var ids = Array.prototype.slice.apply(arguments);
		var cb  = ids.pop();

		if (typeof cb != "function") {
			throw new Error("Missing Model.exists() callback");
		}

		var conditions = {};
		for (var i = 0; i < opts.keys.length; i++) {
			conditions[opts.keys[i]] = ids[i];
		}

		opts.driver.count(opts.table, conditions, {}, function (err, data) {
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

			Instances[idx] = createInstance(Instances[idx], {
				is_new    : true,
				autoSave  : opts.autoSave,
				autoFetch : false
			});
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
	Object.defineProperty(model, "keys", {
		value: opts.keys,
		enumerable: false
	});
	Object.defineProperty(model, "properties", {
		value: opts.properties,
		enumerable: false
	});

	OneAssociation.prepare(model, one_associations, association_properties, model_fields);
	ManyAssociation.prepare(model, many_associations);

	return model;
}
