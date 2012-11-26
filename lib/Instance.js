exports.Instance = Instance;

function Instance(opts) {
	opts = opts || {};
	opts.data = opts.data || {};
	opts.id = opts.id || "id";
	opts.changes = [];

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
		var pending = [];
		for (var k in opts.validations) {
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
				return cb(null);
			}

			var validation = pending.shift();

			validation[1](instance[validation[0]], function (msg) {
				if (msg) {
					var err = new Error(msg);
					err.field = validation[0];
					err.value = instance[validation[0]];
					err.msg = msg;

					return cb(err);
				}

				return checkNextValidation();
			});
		};
		return checkNextValidation();
	};
	var saveInstance = function (cb) {
		if (opts.changes.length === 0) {
			return cb(null, instance);
		}

		handleValidations(function (err) {
			if (err) {
				emitEvent("save", err, instance);
				if (typeof opts.hooks.afterSave == "function") {
					opts.hooks.afterSave.apply(instance, [ true ]);
				}
				if (typeof cb == "function") {
					cb(err, instance);
				}
				return;
			}

			if (typeof opts.hooks.beforeSave == "function") {
				opts.hooks.beforeSave.apply(instance);
			}

			if (!opts.data.hasOwnProperty(opts.id)) {
				opts.driver.insert(opts.table, opts.data, function (err, data) {
					if (!err) {
						opts.changes.length = 0;
						opts.data[opts.id] = data.id;
					}
					emitEvent("save", err, instance);
					if (typeof opts.hooks.afterSave == "function") {
						opts.hooks.afterSave.apply(instance, [ !err ]);
					}
					if (typeof cb == "function") {
						cb(err, instance);
					}
				});
			} else {
				var changes = {};
				for (var i = 0; i < opts.changes.length; i++) {
					changes[opts.changes[i]] = opts.data[opts.changes[i]];
				}
				opts.driver.update(opts.table, changes, opts.id, opts.data.id, function (err) {
					if (!err) {
						opts.changes.length = 0;
					}
					emitEvent("save", err, instance);
					if (typeof opts.hooks.afterSave == "function") {
						opts.hooks.afterSave.apply(instance, [ !err ]);
					}
					if (typeof cb == "function") {
						cb(err, instance);
					}
				});
			}
		});
	};
	var removeInstance = function (cb) {
		if (!opts.data.hasOwnProperty(opts.id)) {
			return cb(null);
		}
		opts.driver.remove(opts.table, opts.id, opts.data.id, function (err, data) {
			emitEvent("remove", err, instance);

			if (typeof cb == "function") {
				cb(err, instance);
			}

			instance = undefined;
		});
	};
	var saveInstanceProperty = function (key, value) {
		var changes = {};
		changes[key] = value;

		if (typeof opts.hooks.beforeSave == "function") {
			opts.hooks.beforeSave.apply(instance);
		}

		opts.driver.update(opts.table, changes, opts.id, opts.data.id, function (err) {
			if (!err) {
				opts.data[key] = value;
			}
			if (typeof opts.hooks.afterSave == "function") {
				opts.hooks.afterSave.apply(instance, [ !err ]);
			}
			emitEvent("save", err, instance);
		});
	};
	var addInstanceProperty = function (key) {
		Object.defineProperty(instance, key, {
			get: function () {
				return opts.data[key];
			},
			set: function (val) {
				if (key == opts.id && opts.data.hasOwnProperty(key)) {
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

	for (var k in opts.data) {
		if (!opts.data.hasOwnProperty(k)) continue;

		addInstanceProperty(k);
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
		value: function (cb) {
			saveInstance(cb);

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

	if (!opts.data.hasOwnProperty(opts.id)) {
		opts.changes = Object.keys(opts.data);
	}

	return instance;
}
