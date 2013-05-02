var Property = require("./Property");
var Hook     = require("./Hook");

exports.Instance = Instance;

function Instance(opts) {
	opts = opts || {};
	opts.data = opts.data || {};
	opts.extra = opts.extra || {};
	opts.id = opts.id || "id";
	opts.changes = (opts.is_new ? Object.keys(opts.data) : []);
	opts.extrachanges = [];

	var events = {};
	var instance = {};
	var emitEvent = function () {
		var args = Array.prototype.slice.apply(arguments);
		var event = args.shift();

		if (!events.hasOwnProperty(event)) return;

		events[event].map(function (cb) {
			cb.apply(instance, args);
		});
	};
	var handleValidations = function (cb) {
		var pending = [], errors = [];
		for (var k in opts.validations) {
			if (!opts.properties[k].required && instance[k] == null) {
				continue; // avoid validating if property is not required and is "empty"
			}
			if (Array.isArray(opts.validations[k])) {
				for (var i = 0; i < opts.validations[k].length; i++) {
					pending.push([ k, opts.validations[k][i] ]);
				}
			} else {
				pending.push([ k, opts.validations[k] ]);
			}
		}
		var checkNextValidation = function () {
			if (pending.length === 0) {
				return cb(errors.length ? errors : null);
			}

			var validation = pending.shift();

			validation[1](instance[validation[0]], function (msg) {
				if (msg) {
					var err   = new Error(msg);

					err.field = validation[0];
					err.value = instance[validation[0]];
					err.msg   = msg;
					err.type  = "validation";

					if (!opts.model.settings.get("instance.returnAllErrors")) {
						return cb(err);
					}

					errors.push(err);
				}

				return checkNextValidation();
			}, instance, opts.model, validation[0]);
		};
		return checkNextValidation();
	};
	var saveInstance = function (cb) {
		if (!opts.is_new && opts.changes.length === 0) {
			return saveInstanceExtra(cb);
		}

		for (var k in opts.properties) {
			if (!opts.properties.hasOwnProperty(k)) continue;
			if (opts.data[k] == null && opts.properties[k].hasOwnProperty("defaultValue")) {
				opts.data[k] = opts.properties[k].defaultValue;
			} else if (opts.properties[k].required && opts.data[k] == null) {
				var err = new Error("required");
				err.field = k;
				err.value = opts.data[k];

				Hook.trigger(instance, opts.hooks.afterSave, false);
				if (typeof cb == "function") {
					cb(err, instance);
				}
				return;
			}
		}

		if (opts.is_new) {
			Hook.trigger(instance, opts.hooks.beforeCreate);
		}
		Hook.trigger(instance, opts.hooks.beforeSave);

		handleValidations(function (err) {
			if (err) {
				emitEvent("save", err, instance);
				Hook.trigger(instance, opts.hooks.afterSave, err === null);
				if (typeof cb == "function") {
					cb(err, instance);
				}
				return;
			}

			var data = {};
			for (var k in opts.data) {
				if (!opts.data.hasOwnProperty(k)) continue;

				if (opts.properties[k]) {
					data[k] = Property.validate(opts.data[k], opts.properties[k]);
					if (opts.driver.propertyToValue) {
						data[k] = opts.driver.propertyToValue(data[k], opts.properties[k]);
					}
				} else {
					data[k] = opts.data[k];
				}
			}

			if (opts.is_new) {
				opts.driver.insert(opts.table, data, opts.keys, function (save_err, info) {
					if (!save_err) {
						opts.changes.length = 0;
						for (var i = 0; i < opts.keys.length; i++) {
							opts.data[opts.keys[i]] = info[opts.keys[i]];
						}
						opts.is_new = false;
					}
					emitEvent("save", save_err, instance);
					Hook.trigger(instance, opts.hooks.afterCreate, !save_err);
					Hook.trigger(instance, opts.hooks.afterSave, !save_err);
					if (typeof cb == "function") {
						if (save_err) {
							return cb(save_err, instance);
						}
						return saveInstanceExtra(cb);
					}
				});
			} else {
				var changes = {}, conditions = {};
				for (var i = 0; i < opts.changes.length; i++) {
					changes[opts.changes[i]] = data[opts.changes[i]];
				}
				for (i = 0; i < opts.keys.length; i++) {
					conditions[opts.keys[i]] = data[opts.keys[i]];
				}
				opts.driver.update(opts.table, changes, conditions, function (save_err) {
					if (!save_err) {
						opts.changes.length = 0;
					}
					emitEvent("save", save_err, instance);
					Hook.trigger(instance, opts.hooks.afterSave, !save_err);
					if (typeof cb == "function") {
						if (save_err) {
							return cb(save_err, instance);
						}
						return saveInstanceExtra(cb);
					}
				});
			}
		});
	};
	var saveInstanceExtra = function (cb) {
		if (opts.extrachanges.length === 0) {
			return cb(null, instance);
		}

		var data = {};
		var conditions = {};

		for (var i = 0; i < opts.extrachanges.length; i++) {
			data[opts.extrachanges[i]] = opts.data[opts.extrachanges[i]];
		}

		conditions[opts.extra_info.id_prop] = opts.extra_info.id;
		conditions[opts.extra_info.assoc_prop] = opts.data[opts.id];

		opts.driver.update(opts.extra_info.table, data, conditions, function (err) {
			return cb(err, instance);
		});
	};
	var removeInstance = function (cb) {
		if (opts.is_new) {
			return cb(null);
		}

		var conditions = {};
		for (var i = 0; i < opts.keys.length; i++) {
			conditions[opts.keys[i]] = opts.data[opts.keys[i]];
		}

		emitEvent("beforeRemove", instance);
		Hook.trigger(instance, opts.hooks.beforeRemove);

		opts.driver.remove(opts.table, conditions, function (err, data) {
			emitEvent("remove", err, instance);
			Hook.trigger(instance, opts.hooks.afterRemove, !err);

			if (typeof cb == "function") {
				cb(err, instance);
			}

			instance = undefined;
		});
	};
	var saveInstanceProperty = function (key, value) {
		var changes = {}, conditions = {};
		changes[key] = value;

		if (opts.properties[key]) {
			changes[key] = Property.validate(changes[key], opts.properties[key]);
			 if (opts.driver.propertyToValue) {
				changes[key] = opts.driver.propertyToValue(changes[key], opts.properties[key]);
			}
		}

		for (var i = 0; i < opts.keys.length; i++) {
			conditions[opts.keys[i]] = opts.data[opts.keys[i]];
		}

		Hook.trigger(instance, opts.hooks.beforeSave);

		opts.driver.update(opts.table, changes, conditions, function (err) {
			if (!err) {
				opts.data[key] = value;
			}
			Hook.trigger(instance, opts.hooks.afterSave, !err);
			emitEvent("save", err, instance);
		});
	};
	var addInstanceProperty = function (key) {
		Object.defineProperty(instance, key, {
			get: function () {
				return opts.data[key];
			},
			set: function (val) {
				if (opts.keys.indexOf(key) >= 0 && opts.data.hasOwnProperty(key)) {
					throw new Error("Cannot change ID");
				}

				opts.data[key] = val;

				if (opts.autoSave) {
					saveInstanceProperty(key, val);
				} else if (opts.changes.indexOf(key) == -1) {
					opts.changes.push(key);
				}
			},
			enumerable: true
		});
	};
	var addInstanceExtraProperty = function (key) {
		if (!instance.hasOwnProperty("extra")) {
			instance.extra = {};
		}
		Object.defineProperty(instance.extra, key, {
			get: function () {
				return opts.data[key];
			},
			set: function (val) {
				opts.data[key] = val;

				/*if (opts.autoSave) {
					saveInstanceProperty(key, val);
				}*/if (opts.extrachanges.indexOf(key) == -1) {
					opts.extrachanges.push(key);
				}
			},
			enumerable: true
		});
	};

	for (var i = 0; i < opts.keys.length; i++) {
		if (!opts.data.hasOwnProperty(opts.keys[i])) {
			addInstanceProperty(opts.keys[i]);
		}
	}

	for (var k in opts.properties) {
		if (opts.properties.hasOwnProperty(k) && !opts.data.hasOwnProperty(k) && opts.keys.indexOf(k) == -1) {
			opts.data[k] = null;
		}
	}

	for (k in opts.data) {
		if (!opts.data.hasOwnProperty(k)) continue;
		if (!opts.properties.hasOwnProperty(k) && opts.keys.indexOf(k) == -1 && opts.association_properties.indexOf(k) == -1) {
			if (!opts.extra.hasOwnProperty(k)) continue;

			if (opts.driver.valueToProperty) {
				opts.data[k] = opts.driver.valueToProperty(opts.data[k], opts.extra[k]);
			}
			addInstanceExtraProperty(k);
			continue;
		}

		if (opts.properties[k] && opts.driver.valueToProperty) {
			opts.data[k] = opts.driver.valueToProperty(opts.data[k], opts.properties[k]);
		}

		addInstanceProperty(k);
	}

	for (k in opts.methods) {
		Object.defineProperty(instance, k, {
			value: opts.methods[k].bind(instance),
			enumerable: false
		});
	}

	Object.defineProperty(instance, "on", {
		value: function (event, cb) {
			if (!events.hasOwnProperty(event)) {
				events[event] = [];
			}
			events[event].push(cb);

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(instance, "save", {
		value: function () {
			if (arguments.length === 0) {
				saveInstance();
			} else {
				switch (typeof arguments[0]) {
					case "object":
						for (var k in arguments[0]) {
							if (arguments[0].hasOwnProperty(k)) {
								this[k] = arguments[0][k];
							}
						}
						saveInstance(arguments[1]);
						break;
					case "function":
						saveInstance(arguments[0]);
						break;
					default:
						throw new Error("Unknown parameter type '" + (typeof arguments[0]) + "' in Instance.save()");
				}
			}

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(instance, "saved", {
		value: function () {
			return opts.changes.length === 0;
		},
		enumerable: false
	});
	Object.defineProperty(instance, "remove", {
		value: function (cb) {
			removeInstance(cb);

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(instance, "isInstance", {
		value: true,
		enumerable: false
	});
	Object.defineProperty(instance, "validate", {
		value: function (cb) {
			handleValidations(cb);
		},
		enumerable: false
	});

	for (var i = 0; i < opts.keys.length; i++) {
		if (!opts.data.hasOwnProperty(opts.keys[i])) {
			opts.changes = Object.keys(opts.data);
			break;
		}
	}

	Hook.trigger(instance, opts.hooks.afterLoad);

	return instance;
}
