var _         = require("lodash");
var Settings  = require("../Settings");
var util      = require("../Utilities");
var Accessors = { "get": "get", "set": "set", "has": "has", "del": "remove" };

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
			association.field = util.formatField(association.model, association.name, association.required, association.reversed);
		} else if(!association.extension) {
			association.field = util.wrapFieldObject(association.field, Model, Model.table, Model.properties);
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
				from  : { table: association.model.table, field: association.model.id },
				to    : { table: Model.table, field: Object.keys(association.field) },
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

function extendInstance(Model, Instance, Driver, association, opts) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value: function (opts, cb) {
			if (typeof opts == "function") {
				cb = opts;
				opts = {};
			}

			if (util.hasValues(Instance, Object.keys(association.field))) {
				association.model.get(util.values(Instance, Object.keys(association.field)), opts, function (err, instance) {
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
				if (util.hasValues(Instance, Model.id)) {
					association.model.find(util.getConditions(Model, Object.keys(association.field), Instance), opts, cb);
				} else {
					cb(null);
				}
			} else {
				if (Instance.isShell()) {
					Model.get(util.values(Instance, Model.id), function (err, instance) {
						if (err || !util.hasValues(instance, Object.keys(association.field))) {
							return cb(null);
						}
						association.model.get(util.values(instance, Object.keys(association.field)), opts, cb);
					});
				} else if (util.hasValues(Instance, Object.keys(association.field))) {
					association.model.get(util.values(Instance, Object.keys(association.field)), opts, cb);
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

					if (!Array.isArray(OtherInstance)) {
						util.populateConditions(Model, Object.keys(association.field), Instance, OtherInstance, true);

						return OtherInstance.save({}, { saveAssociations: false }, cb);
					}

					var associations = _.clone(OtherInstance);

					var saveNext = function () {
						if (!associations.length) {
							return cb();
						}

						var other = associations.pop();

						util.populateConditions(Model, Object.keys(association.field), Instance, other, true);

						other.save({}, { saveAssociations: false }, function (err) {
							if (err) {
								return cb(err);
							}

							saveNext();
						});
					};

					return saveNext();
				});
			} else {
				OtherInstance.save({}, { saveAssociations: false }, function (err) {
					if (err) {
						return cb(err);
					}

					util.populateConditions(association.model, Object.keys(association.field), OtherInstance, Instance);

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
				for (var k in association.field) {
					Instance[k] = null;
				}
				Instance.save({}, { saveAssociations: false }, cb);

				return this;
			},
			enumerable: false
		});
	}
}

function autoFetchInstance(Instance, association, opts, cb) {
	if (!Instance.saved()) {
		return cb();
	}

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
