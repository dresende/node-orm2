var ErrorCodes = require("../ErrorCodes");
var Settings   = require("../Settings");
var Singleton  = require("../Singleton");

exports.prepare = function (db, Model, associations, association_properties, model_fields) {
	Model.extendsTo = function (name, properties, opts) {
		opts = opts || {};

		var assocName = opts.name || ucfirst(name);
		var association = {
			name           : name,
			reversed       : opts.reversed,
			autoFetch      : opts.autoFetch || false,
			autoFetchLimit : opts.autoFetchLimit || 2,
			field          : wrapFieldObject(opts.field, Model, []) || formatField(Model, Model.table, false),
			getAccessor    : opts.getAccessor || ("get" + assocName),
			setAccessor    : opts.setAccessor || ("set" + assocName),
			hasAccessor    : opts.hasAccessor || ("has" + assocName),
			delAccessor    : opts.delAccessor || ("remove" + assocName)
		};

		association.model = db.define(Model.table + "_" + name, properties, {
			id        : null,
			keys      : getKeys(association.field),
			extension : true
		});
		association.model.hasOne(Model.table, Model, { extension: true, field: association.field });

		associations.push(association);

		return association.model;
	};
};

exports.extend = function (Model, Instance, Driver, associations, opts) {
	for (var i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i], opts);
	}
};

exports.autoFetch = function (Instance, associations, opts, cb) {
	if (associations.length === 0) {
		return cb();
	}

	var pending = associations.length;
	var autoFetchDone = function autoFetchDone() {
		pending -= 1;

		if (pending === 0) {
			return cb();
		}
	};

	for (var i = 0; i < associations.length; i++) {
		autoFetchInstance(Instance, associations[i], opts, autoFetchDone);
	}
};

function getKeys(arr) {
	var keys = [];
	for (k in arr)
		keys.push(k);
	return keys;
}

function wrapFieldObject(obj, Model, alternatives) {
    if (!obj) {
        obj = Model.settings.get("properties.association_key").replace("{name}", Model.table.toLowerCase()).replace("{field}", "id");
    }
    isvalid = false;
    for (k in obj) {
        if (!/[0-9]+/.test(k) && obj.hasOwnProperty(k)) isvalid = true;
    }
    if (isvalid) return obj;

    newobj = {};
    newobj[obj] = alternatives[obj] || alternatives[Model.keys[0]] || { type: 'number', unsigned: true, rational: false };
    return newobj;
}

function formatField(Model, name, required) {
	var fields = {};
	var keys = ["id"];
	if (Model.keys instanceof Array) {
		keys = Model.keys;
	}
	else {
		keys = [Model.keys];
	}

	for (var i = 0; i < keys.length; i++) {
		var fieldName = Model.settings.get("properties.association_key").replace("{name}", name.toLowerCase()).replace("{field}", Model.keys[i]);
		var fieldOpts = {
			type: "number",
			unsigned: true,
			size: 4
		};

		if (Model.properties.hasOwnProperty(Model.keys[i])) {
			var p = Model.properties[Model.keys[i]];
			fieldOpts = {
				type: p.type || "number",
				size: p.size || 4,
				rational: p.rational || false,
				unsigned: p.unsigned || true,
				time: p.time || false,
				big: p.big || false,
				values: p.values || null
			};
		};

		fields[fieldName] = fieldOpts;
	}
	
	return fields;
}

function makeConditions(Instance, Model) {
	var conditions = [];
	for (i = 0; i < Model.keys.length; i++) {
		conditions.push(Instance[Model.keys[i]]);
	}
	return conditions;
}

function extendInstance(Model, Instance, Driver, association, opts) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value : function (cb) {
			if (!Instance[Model.id]) {
				cb(ErrorCodes.generateError(ErrorCodes.NOT_DEFINED, "Instance not saved, cannot get extension"));
			} else {
				association.model.get(makeConditions(Instance, Model), function (err, extension) {
					return cb(err, !err && extension ? true : false);
				});
			}
			return this;
		},
		enumerable : false
	});
	Object.defineProperty(Instance, association.getAccessor, {
		value: function (cb) {
			if (!Instance[Model.id]) {
				cb(ErrorCodes.generateError(ErrorCodes.NOT_DEFINED, "Instance not saved, cannot get extension"));
			} else {
				association.model.get(makeConditions(Instance, Model), cb);
			}
			return this;
		},
		enumerable : false
	});
	Object.defineProperty(Instance, association.setAccessor, {
		value : function (Extension, cb) {
			Instance.save(function (err) {
				if (err) {
					return cb(err);
				}

				Instance[association.delAccessor](function (err) {
					if (err) {
						return cb(err);
					}

					var fields = getKeys(association.field);
					for (i = 0; i < Model.keys.length; i++) {
						Extension[fields[i]] = Instance[Model.keys[i]];
					}

					Extension.save(cb);
				});
			});
			return this;
		},
		enumerable : false
	});
	Object.defineProperty(Instance, association.delAccessor, {
		value : function (cb) {
			if (!Instance[Model.id]) {
				cb(ErrorCodes.generateError(ErrorCodes.NOT_DEFINED, "Instance not saved, cannot get extension"));
			} else {
				var conditions = {};
				var fields = getKeys(association.field);
				for (i = 0; i < Model.keys.length; i++) {
					conditions[fields[i]] = Instance[Model.keys[i]];
				}

				association.model.find(conditions, function (err, extensions) {
					if (err) {
						return cb(err);
					}

					var pending = extensions.length;

					for (var i = 0; i < extensions.length; i++) {
						Singleton.clear(extensions[i].__singleton_uid());
						extensions[i].remove(function () {
							if (--pending === 0) {
								return cb();
							}
						});
					}

					if (pending === 0) {
						return cb();
					}
				});
			}
			return this;
		},
		enumerable : false
	});
}

function autoFetchInstance(Instance, association, opts, cb) {
	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit == "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
		return cb();
	}

	if (Instance.isPersisted()) {
		Instance[association.getAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 }, function (err, Assoc) {
			if (!err) {
				Instance[association.name] = Assoc;
			}

			return cb();
		});
	} else {
		return cb();
	}
}

function ucfirst(text) {
	return text[0].toUpperCase() + text.substr(1);
}
