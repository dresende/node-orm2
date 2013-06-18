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
		var pending = [], errors = [], required;

		for (var k in opts.validations) {
			if (opts.properties[k]) {
				required = opts.properties[k].required;
			} else {
				for (var i = 0; i < opts.one_associations.length; i++) {
					if (opts.one_associations[i].field == k) {
						required = opts.one_associations[i].required;
						break;
					}
				}
			}
			if (!required && instance[k] == null) {
				continue; // avoid validating if property is not required and is "empty"
			}
			for (var i = 0; i < opts.validations[k].length; i++) {
				pending.push([ k, opts.validations[k][i] ]);
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
	var saveError = function (cb, err) {
		emitEvent("save", err, instance);
		Hook.trigger(instance, opts.hooks.afterSave, false);
		if (typeof cb == "function") {
			cb(err, instance);
		}
	};
	var saveInstance = function (cb, saveOptions) {
		if (!opts.is_new && opts.changes.length === 0) {
			return saveInstanceExtra(cb);
		}

		Hook.wait(instance, opts.hooks.beforeValidation, function (err) {
			if (err) {
				return saveError(cb, err);
			}

			for (var k in opts.properties) {
				if (!opts.properties.hasOwnProperty(k)) continue;
				if (opts.data[k] == null && opts.properties[k].hasOwnProperty("defaultValue")) {
					opts.data[k] = opts.properties[k].defaultValue;
				}
			}

			if (opts.is_new) {
				return Hook.wait(instance, opts.hooks.beforeCreate, function (err) {
					if (err) {
						return saveError(cb, err);
					}
					Hook.wait(instance, opts.hooks.beforeSave, function (err) {
						if (err) {
							return saveError(cb, err);
						}
						return saveInstanceNext(cb, saveOptions);
					});
				});
			}
			Hook.wait(instance, opts.hooks.beforeSave, function (err) {
				if (err) {
					return saveError(cb, err);
				}
				return saveInstanceNext(cb, saveOptions);
			});
		});
	};

	var afterSave = function (cb, create, err) {
		emitEvent("save", err, instance);
		if(create) {
			Hook.trigger(instance, opts.hooks.afterCreate, !err);
		}
		Hook.trigger(instance, opts.hooks.afterSave, !err);

		if (!err) {
			saveInstanceExtra(cb);
		}
	};

	var saveInstanceNext = function (cb, saveOptions) {
		handleValidations(function (err) {
			if (err) {
				return saveError(cb, err);
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

			var next = afterSave.bind(this, cb, opts.is_new);

			if (opts.is_new) {
				opts.driver.insert(opts.table, data, opts.keys, function (save_err, info) {
					if (save_err) {
						return saveError(cb, save_err);
					}

					opts.changes.length = 0;
					for (var i = 0; i < opts.keys.length; i++) {
						opts.data[opts.keys[i]] = info.hasOwnProperty(opts.keys[i]) ? info[opts.keys[i]] : data[opts.keys[i]];
					}
					opts.is_new = false;

					if(saveOptions.saveAssociations === false) {
						next();
					} else {
						saveAssociations(next);
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
					if (save_err) {
						return saveError(cb, save_err);
					}

					opts.changes.length = 0;

					if(saveOptions.saveAssociations === false) {
						next();
					} else {
						saveAssociations(next);
					}
				});
			}
		});
	};
	var saveAssociations = function (cb) {
		var pending = 0, errored = false, i, j, name;

		for (i = 0; i < opts.one_associations.length; i++) {
			name = opts.one_associations[i].name;

			if (!instance.hasOwnProperty(name)) continue;

			if (instance[name] && instance[name].isInstance) {
				pending += 1;

				instance[opts.one_associations[i].setAccessor](instance[name], function (err) {
					if (err) {
						if (errored) return;

						errored = true;
						return cb(err);
					}

					if (--pending === 0) {
						return cb();
					}
				});
			}
		}

		for (i = 0; i < opts.many_associations.length; i++) {
			if (!instance.hasOwnProperty(opts.many_associations[i].name)) continue;

			pending += 1;

			instance[opts.many_associations[i].setAccessor](instance[opts.many_associations[i].name], function (err) {
				if (err) {
					if (errored) return;

					errored = true;
					return cb(err);
				}

				if (--pending === 0) {
					return cb();
				}
			});
		}

		if (pending === 0) {
			return cb();
		}
	};
	var saveInstanceExtra = function (cb) {
		if (opts.extrachanges.length === 0) {
			if (cb) return cb(null, instance);
			else return;
		}

		var data = {};
		var conditions = {};

		for (var i = 0; i < opts.extrachanges.length; i++) {
			data[opts.extrachanges[i]] = opts.data[opts.extrachanges[i]];
		}

		conditions[opts.extra_info.id_prop] = opts.extra_info.id;
		conditions[opts.extra_info.assoc_prop] = opts.data[opts.id];

		opts.driver.update(opts.extra_info.table, data, conditions, function (err) {
			if (cb)	return cb(err, instance);
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

		Hook.wait(instance, opts.hooks.beforeRemove, function (err) {
			if (err) {
				emitEvent("remove", err, instance);
				if (typeof cb == "function") {
					cb(err, instance);
				}
				return;
			}

			emitEvent("beforeRemove", instance);

			opts.driver.remove(opts.table, conditions, function (err, data) {
				Hook.trigger(instance, opts.hooks.afterRemove, !err);

				emitEvent("remove", err, instance);

				if (typeof cb == "function") {
					cb(err, instance);
				}

				instance = undefined;
			});
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

		Hook.wait(instance, opts.hooks.beforeSave, function (err) {
			if (err) {
				Hook.trigger(instance, opts.hooks.afterSave, false);
				emitEvent("save", err, instance);
				return;
			}

			opts.driver.update(opts.table, changes, conditions, function (err) {
				if (!err) {
					opts.data[key] = value;
				}
				Hook.trigger(instance, opts.hooks.afterSave, !err);
				emitEvent("save", err, instance);
			});
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

				if (opts.data[key] === val) return;
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
			var arg = null, objCount = 0;
			var data = {}, saveOptions = {}, callback = null;

			while(arguments.length > 0) {
				arg = Array.prototype.shift.call(arguments);
				switch(typeof arg) {
					case 'object':
						switch(objCount) {
							case 0:
								data = arg;
								break;
							case 1:
								saveOptions = arg;
								break;
						}
						objCount++;
						break;
					case 'function':
						callback = arg;
						break;
					default:
						throw new Error("Unknown parameter type '" + (typeof arg) + "' in Instance.save()");
				}
			}

			for (var k in data) {
				if (data.hasOwnProperty(k)) {
					this[k] = data[k];
				}
			}

			saveInstance(callback, saveOptions);

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
	Object.defineProperty(instance, "isPersisted", {
		value: function () {
			return !opts.is_new;
		},
		enumerable: false
	});
	Object.defineProperty(instance, "isShell", {
		value: function () {
			return opts.isShell;
		},
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
	for (i = 0; i < opts.one_associations.length; i++) {
		var asc = opts.one_associations[i]

		if (!asc.reversed && !opts.data.hasOwnProperty(asc.field)) {
			addInstanceProperty(asc.field);
		}
		if (opts.data.hasOwnProperty(asc.name)) {
			if (typeof opts.data[asc.name] == "object") {
				if (opts.data[asc.name].isInstance) {
					instance[asc.name] = opts.data[asc.name];
				} else {
					instance[asc.name] = new opts.one_associations[i].model(opts.data[asc.name]);
				}
			}
			delete opts.data[asc.name];
		}
	}
	for (i = 0; i < opts.many_associations.length; i++) {
		if (opts.data.hasOwnProperty(opts.many_associations[i].name)) {
			instance[opts.many_associations[i].name] = opts.data[opts.many_associations[i].name];
			delete opts.data[opts.many_associations[i].name];
		}
	}

	Hook.trigger(instance, opts.hooks.afterLoad);

	return instance;
}
