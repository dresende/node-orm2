var Settings  = require("../Settings");
var Accessors = { "get": "get", "set": "set", "has": "has", "del": "remove" };
var _         = require("lodash");

exports.prepare = function (Model, associations, association_properties, model_fields) {
	Model.hasOne = function () {
		var assocName;
		var association = {
			name           : Model.table,
			model          : Model,
			reversed       : false,
			extension      : false,
			autoFetch      : false,
			autoFetchLimit : 2,
			required       : false
		};

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "string":
					association.name = arguments[i];
					break;
				case "function":
					if (arguments[i].table) {
						association.model = arguments[i];
					}
					break;
				case "object":
					association = _.extend(association, arguments[i]);
					break;
			}
		}

		assocName = ucfirst(association.name);

		if (!association.hasOwnProperty("field")) {
		    association.field = formatField(Model, association.name, association.required, association.reversed);
		} else if(!association.extension) {
		    association.field = wrapFieldObject(association.field, Model, Model.properties);
		}
		for (var k in Accessors) {
			if (!association.hasOwnProperty(k + "Accessor")) {
				association[k + "Accessor"] = Accessors[k] + assocName;
			}
		}

		associations.push(association);
		for (k in association.field) {
		    association_properties.push(k);
		    if (!association.reversed) {
		        model_fields.push(k);
		    }
		}

		if (association.reverse) {
			association.model.hasOne(association.reverse, Model, {
				reversed       : true,
				field          : association.field,
				autoFetch      : association.autoFetch,
				autoFetchLimit : association.autoFetchLimit
			});
		}

		Model["findBy" + assocName] = function () {
			var cb = null, conditions = null, options = {};

			for (var i = 0; i < arguments.length; i++) {
				switch (typeof arguments[i]) {
					case "function":
						cb = arguments[i];
						break;
					case "object":
						if (conditions === null) {
							conditions = arguments[i];
						} else {
							options = arguments[i];
						}
						break;
				}
			}

			if (conditions === null) {
				throw ErrorCodes.generateError(ErrorCodes.PARAM_MISSMATCH, ".findBy(" + assocName + ") is missing a conditions object");
			}

			options.__merge = {
				from  : { table: association.model.table, field: association.model.keys },
				to    : { table: Model.table, field: getKeys(association.field) },
				where : [ association.model.table, conditions ],
				table : Model.table
			};
			options.extra = [];

			if (typeof cb == "function") {
				return Model.find({}, options, cb);
			}
			return Model.find({}, options);
		};

		return this;
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

function formatField(Model, name, required, reversed) {
	var fields = {};
	var keys = ["id"];
	if (Model.keys instanceof Array) {
		keys = Model.keys;
	}
	else {
		keys = [Model.keys];
	}

	for (var i = 0; i < keys.length; i++) {
		var fieldName = reversed ? keys[i] : Model.settings.get("properties.association_key").replace("{name}", name.toLowerCase()).replace("{field}", keys[i]);
		var fieldOpts = {
			type: "number",
			unsigned: true,
            rational: false,
			size: 4,
			required: required
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
				values: p.values || null,
				required: required
			};
		};

		fields[fieldName] = fieldOpts;
	}

	return fields;
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

function getKeys(arr) {
    var keys = [];
    for (k in arr) {
        keys.push(k);
    }
    return keys;
}

function populateConditions(Model, fields, source, target) {
    for (i = 0; i < Model.keys.length; i++) {
        target[fields[i]] = source[Model.keys[i]];
    }
}

function getConditions(model, fields, from) {
    var conditions = {};
    populateConditions(model, fields, from, conditions);
    return conditions;
}

function getIDs(keys, from) {
    var ids = [];
    for (i = 0; i < keys.length; i++) {
        ids.push(from[keys[i]]);
    }
    return ids;
}

function hasFields(fields, instance) {
    for (i = 0; i < fields.length; i++) {
        if (instance[fields[i]]) return true;
    }
    return false;
}

function extendInstance(Model, Instance, Driver, association, opts) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value: function (opts, cb) {
			if (typeof opts == "function") {
				cb = opts;
				opts = {};
			}

			if (hasFields(getKeys(association.field), Instance)) {
				association.model.get(getIDs(getKeys(association.field), Instance), opts, function (err, instance) {
					return cb(err, instance ? true : false);
				});
			} else {
				cb(null, false);
			}

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.getAccessor, {
		value: function (opts, cb) {
			if (typeof opts == "function") {
				cb = opts;
				opts = {};
			}

			if (association.reversed) {
				if (hasFields(Model.keys, Instance)) {
				    association.model.find(getConditions(Model, getKeys(association.field), Instance), opts, cb);
				} else {
					cb(null);
				}
			} else {
			    if (Instance.isShell()) {
					Model.get(getIDs(Model.keys, Instance), function (err, instance) {
					    if (err || !hasFields(getKeys(association.field), instance)) {
							return cb(null);
						}
						association.model.get(getIDs(getKeys(association.field), instance), opts, cb);
					});
				} else if (hasFields(getKeys(association.field), Instance)) {
				    association.model.get(getIDs(getKeys(association.field), Instance), opts, cb);
				} else {
					cb(null);
				}
			}

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.setAccessor, {
		value: function (OtherInstance, cb) {
			if (association.reversed) {
				Instance.save(function (err) {
					if (err) {
						return cb(err);
					}

					populateConditions(Model, getKeys(association.field), Instance, OtherInstance);

					return OtherInstance.save({}, { saveAssociations: false }, cb);
				});
			} else {
				OtherInstance.save({}, { saveAssociations: false }, function (err) {
					if (err) {
						return cb(err);
					}

					populateConditions(association.model, getKeys(association.field), OtherInstance, Instance);

					return Instance.save({}, { saveAssociations: false }, cb);
				});
			}

			return this;
		},
		enumerable: false
	});
	if (!association.reversed) {
		Object.defineProperty(Instance, association.delAccessor, {
		    value: function (cb) {
		        for (k in association.field) {
		            Instance[k] = null;
		        }
				Instance.save(cb);

				return this;
			},
			enumerable: false
		});
	}
}

function autoFetchInstance(Instance, association, opts, cb) {
	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit == "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
		return cb();
	}

	// When we have a new non persisted instance for which the association field (eg owner_id)
	// is set, we don't want to auto fetch anything, since `new Model(owner_id: 12)` takes no
	// callback, and hence this lookup would complete at an arbitrary point in the future.
	// The associated entity should probably be fetched when the instance is persisted.
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
