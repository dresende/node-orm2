var ChainFind         = require("./ChainFind");
var Instance          = require("./Instance").Instance;
var LazyLoad          = require("./LazyLoad");
var ManyAssociation   = require("./Associations/Many");
var OneAssociation    = require("./Associations/One");
var ExtendAssociation = require("./Associations/Extend");
var Property          = require("./Property");
var Singleton         = require("./Singleton");
var Utilities         = require("./Utilities");
var Validators        = require("./Validators");
var ErrorCodes        = require("./ErrorCodes");
var Hook              = require("./Hook");
var AvailableHooks    = [
	"beforeCreate", "afterCreate",
	"beforeSave", "afterSave",
	"beforeValidation",
	"beforeRemove", "afterRemove",
	"afterLoad",
	"afterAutoFetch"
];

exports.Model = Model;

function Model(opts) {
	opts = opts || {};

	if ((!Array.isArray(opts.keys) || opts.keys.length < 2) && !opts.extension) {
		opts.keys = [ opts.id ];
	} else {
		opts.id = null;
	}

	var one_associations       = [];
	var many_associations      = [];
	var extend_associations    = [];
	var association_properties = [];
	var model_fields           = [];

	for (var i = 0; i < opts.keys.length; i++) {
		model_fields.push(opts.keys[i]);
	}

	var createHookHelper = function (hook) {
		return function (cb) {
			if (typeof cb != "function") {
				delete opts.hooks[hook];
			} else {
				opts.hooks[hook] = cb;
			}
			return this;
		};
	};
	var createInstance = function (data, inst_opts, cb) {
		if (!inst_opts) {
			inst_opts = {};
		}

		var found_assoc = false, i, k;

		for (k in data) {
			if (k == "extra_field") continue;
			if (opts.properties.hasOwnProperty(k)) continue;
			if (inst_opts.extra && inst_opts.extra.hasOwnProperty(k)) continue;
			if (opts.keys.indexOf(k) >= 0) continue;
			if (association_properties.indexOf(k) >= 0) continue;

			found_assoc = false;
			for (i = 0; i < one_associations.length; i++) {
				if (one_associations[i].name == k) {
					found_assoc = true;
					break;
				}
			}
			if (!found_assoc) {
				for (i = 0; i < many_associations.length; i++) {
					if (many_associations[i].name == k) {
						found_assoc = true;
						break;
					}
				}
			}
			if (!found_assoc) {
				delete data[k];
			}
		}

		var assoc_opts = {
			autoFetch      : inst_opts.autoFetch || false,
			autoFetchLimit : inst_opts.autoFetchLimit,
			cascadeRemove  : inst_opts.cascadeRemove
		};
		var pending  = 2;
		var instance = new Instance(model, {
			uid                    : inst_opts.uid, // singleton unique id
			id                     : opts.id,
			keys                   : opts.keys,
			is_new                 : inst_opts.is_new || false,
			isShell                : inst_opts.isShell || false,
			data                   : data,
			autoSave               : inst_opts.autoSave || false,
			extra                  : inst_opts.extra,
			extra_info             : inst_opts.extra_info,
			driver                 : opts.driver,
			table                  : opts.table,
			hooks                  : opts.hooks,
			methods                : opts.methods,
			validations            : opts.validations,
			one_associations       : one_associations,
			many_associations      : many_associations,
			extend_associations    : extend_associations,
			association_properties : association_properties
		});
		instance.on("ready", function () {
			if (--pending > 0) return;
			if (typeof cb == "function") {
				return cb(instance);
			}
		});
		if (model_fields !== null) {
			LazyLoad.extend(instance, model, opts.properties);
		}
		OneAssociation.extend(model, instance, opts.driver, one_associations, assoc_opts);
		ManyAssociation.extend(model, instance, opts.driver, many_associations, assoc_opts);
		ExtendAssociation.extend(model, instance, opts.driver, extend_associations, assoc_opts);

		OneAssociation.autoFetch(instance, one_associations, assoc_opts, function () {
			ManyAssociation.autoFetch(instance, many_associations, assoc_opts, function () {
				ExtendAssociation.autoFetch(instance, extend_associations, assoc_opts, function () {
					Hook.wait(instance, opts.hooks.afterAutoFetch, function (err) {
						if (--pending > 0) return;
						if (typeof cb == "function") {
							return cb(instance);
						}
					});
				});
			});
		});
		return instance;
	};

	var model = function (data) {
		var instance;
		if (typeof data == "number") {
			var data2 = {};
			data2[opts.id] = data;

			return createInstance(data2, { isShell: true });
		} else if (typeof data == "undefined") {
			data = {};
		}

		return createInstance(data, {
			is_new        : !data.hasOwnProperty(opts.id),
			autoSave      : opts.autoSave,
			cascadeRemove : opts.cascadeRemove
		});
	};

	// Standardize validations
	for (var k in opts.validations) {
		if (typeof opts.validations[k] == 'function') {
			opts.validations[k] = [ opts.validations[k] ];
		}
	}

	for (k in opts.properties) {
		opts.properties[k] = Property.normalize(opts.properties[k], opts.settings);

		if (opts.properties[k].lazyload !== true) {
			model_fields.push(k);
		}
		if (opts.properties[k].required) {
			// Prepend `required` validation
			if(opts.validations.hasOwnProperty(k)) {
				opts.validations[k].splice(0, 0, Validators.required());
			} else {
				opts.validations[k] = [Validators.required()];
			}
		}
	}

	for (k in AvailableHooks) {
		model[AvailableHooks[k]] = createHookHelper(AvailableHooks[k]);
	}

	model.properties = opts.properties;
	model.settings   = opts.settings;

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

		return cb(ErrorCodes.generateError(ErrorCodes.NO_SUPPORT, "Driver does not support Model.drop()"));
	};

	model.sync = function (cb) {
		if (arguments.length === 0) {
			cb = function () {};
		}
		if (typeof opts.driver.sync == "function") {
			try {
				opts.driver.sync({
					extension           : opts.extension,
					keys                : opts.keys,
					table               : opts.table,
					properties          : opts.properties,
					indexes             : opts.indexes || [],
					one_associations    : one_associations,
					many_associations   : many_associations,
					extend_associations : extend_associations
				}, cb);
			} catch (e) {
				return cb(e);
			}

			return this;
		}

		return cb(ErrorCodes.generateError(ErrorCodes.NO_SUPPORT, "Driver does not support Model.sync()"));
	};

	model.get = function () {
		var conditions = {};
		var options    = {};
		var ids        = Array.prototype.slice.apply(arguments);
		var cb         = ids.pop();

		if (typeof cb != "function") {
			throw ErrorCodes.generateError(ErrorCodes.MISSING_CALLBACK, "Missing Model.get() callback");
		}

		if (typeof ids[ids.length - 1] == "object" && !Array.isArray(ids[ids.length - 1])) {
			options = ids.pop();
		}

		if (ids.length == 1 && Array.isArray(ids[0])) {
			ids = ids[0];
		}

		if (ids.length != opts.keys.length) {
			throw ErrorCodes.generateError(ErrorCodes.PARAM_MISSMATCH, "Model.get() IDs number missmatch (" + opts.keys.length + " needed, " + ids.length + " passed)");
		}

		for (var i = 0; i < opts.keys.length; i++) {
			conditions[opts.keys[i]] = ids[i];
		}

		if (!options.hasOwnProperty("autoFetchLimit")) {
			options.autoFetchLimit = opts.autoFetchLimit;
		}
		if (!options.hasOwnProperty("cascadeRemove")) {
			options.cascadeRemove = opts.cascadeRemove;
		}

		opts.driver.find(model_fields, opts.table, conditions, { limit: 1 }, function (err, data) {
			if (err) {
				return cb(ErrorCodes.generateError(ErrorCodes.QUERY_ERROR, err.message, { originalCode: err.code }));
			}
			if (data.length === 0) {
				return cb(ErrorCodes.generateError(ErrorCodes.NOT_FOUND, "Not found"));
			}

			var uid = opts.driver.uid + "/" + opts.table + "/" + ids.join("/");

			Singleton.get(uid, {
				cache      : (options.hasOwnProperty("cache") ? options.cache : opts.cache),
				save_check : opts.settings.get("instance.cacheSaveCheck")
			}, function (cb) {
				return createInstance(data[0], {
					uid            : uid,
					autoSave       : opts.autoSave,
					autoFetch      : (options.autoFetchLimit === 0 ? false : opts.autoFetch),
					autoFetchLimit : options.autoFetchLimit,
					cascadeRemove  : options.cascadeRemove
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
		if (!options.hasOwnProperty("autoFetchLimit")) {
			options.autoFetchLimit = opts.autoFetchLimit;
		}
		if (!options.hasOwnProperty("cascadeRemove")) {
			options.cascadeRemove = opts.cascadeRemove;
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
				var uid = opts.driver.uid + "/" + opts.table + (merge ? "+" + merge.from.table : "");
				for (var i = 0; i < opts.keys.length; i++) {
					uid += "/" + data[opts.keys[i]];
				}

				Singleton.get(uid, {
					cache      : options.cache,
					save_check : opts.settings.get("instance.cacheSaveCheck")
				}, function (cb) {
					return createInstance(data, {
						uid            : uid,
						autoSave       : opts.autoSave,
						autoFetch      : (options.autoFetchLimit === 0 ? false : (options.autoFetch || opts.autoFetch)),
						autoFetchLimit : options.autoFetchLimit,
						cascadeRemove  : options.cascadeRemove,
						extra          : options.extra,
						extra_info     : options.extra_info
					}, cb);
				}, function (instance) {
					return cb(null, instance);
				});
			}
		});

		if (typeof cb != "function") {
			return chain;
		}

		chain.run(cb);

		return this;
	};

	model.all = model.find;

	model.one = function () {
		var args = Array.prototype.slice.apply(arguments);
		var cb   = null;

		// extract callback
		for (var i = 0; i < args.length; i++) {
			if (typeof args[i] == "function") {
				cb = args.splice(i, 1)[0];
				break;
			}
		}

		if (cb === null) {
			throw ErrorCodes.generateError(ErrorCodes.MISSING_CALLBACK, "Missing Model.one() callback");
		}

		// add limit 1
		args.push(1);
		args.push(function (err, results) {
			if (err) {
				return cb(err);
			}
			return cb(null, results.length ? results[0] : null);
		});

		return this.find.apply(this, args);
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
			throw ErrorCodes.generateError(ErrorCodes.MISSING_CALLBACK, "Missing Model.count() callback");
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
			table       : opts.table,
			driver_name : opts.driver_name,
			driver      : opts.driver,
			conditions  : conditions,
			properties  : properties
		});
	};

	model.exists = function () {
		var ids = Array.prototype.slice.apply(arguments);
		var cb  = ids.pop();

		if (typeof cb != "function") {
			throw ErrorCodes.generateError(ErrorCodes.MISSING_CALLBACK, "Missing Model.exists() callback");
		}

		var conditions = {}, i;

		if (ids.length === 1 && typeof ids[0] == "object") {
			if (Array.isArray(ids[0])) {
				for (i = 0; i < opts.keys.length; i++) {
					conditions[opts.keys[i]] = ids[0][i];
				}
			} else {
				conditions = ids[0];
			}
		} else {
			for (i = 0; i < opts.keys.length; i++) {
				conditions[opts.keys[i]] = ids[i];
			}
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
		var cb = null, idx = 0, single = false;
		var createNext = function () {
			if (idx >= Instances.length) {
				return cb(null, single ? Instances[0] : Instances);
			}

			Instances[idx] = createInstance(Instances[idx], {
				is_new    : true,
				autoSave  : opts.autoSave,
				autoFetch : false
			}, function () {
				Instances[idx].save(function (err) {
					if (err) {
						err.index = idx;
						err.instance = Instances[idx];

						return cb(err);
					}

					idx += 1;
					createNext();
				});
			});
		};

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "object":
					if ( !single && Array.isArray(arguments[i]) ) {
						Instances = Instances.concat(arguments[i]);
					} else if (i == 0) {
						single = true;
						Instances.push(arguments[i]);
					} else {
						options = arguments[i];
					}
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
	ExtendAssociation.prepare(opts.db, model, extend_associations);

	return model;
}
