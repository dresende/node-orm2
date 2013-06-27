var Settings = require("../Settings");

exports.prepare = function (Model, associations, association_properties, model_fields) {
	Model.hasOne = function (name, OtherModel, opts) {
		if (typeof OtherModel == "object" && !OtherModel.table) {
			opts = OtherModel;
			OtherModel = null;
		}
		opts = opts || {};

		var assocName = opts.name || ucfirst(name);
		var association = {
			name           : name,
			model          : OtherModel || Model,
			reversed       : opts.reversed,
			autoFetch      : opts.autoFetch || false,
			autoFetchLimit : opts.autoFetchLimit || 2,
			field          : opts.field || Model.settings.get("properties.association_key").replace("{name}", name),
			required       : opts.required || false,
			getAccessor    : opts.getAccessor || ("get" + assocName),
			setAccessor    : opts.setAccessor || ("set" + assocName),
			hasAccessor    : opts.hasAccessor || ("has" + assocName),
			delAccessor    : opts.delAccessor || ("remove" + assocName)
		};
		associations.push(association);
		association_properties.push(association.field);
		if(!opts.reversed) {
			model_fields.push(association.field);
		}

		if (opts.reverse) {
			OtherModel.hasOne(opts.reverse, Model, {
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
				from: { table: association.model.table, field: association.model.id },
				to: { table: Model.table, field: association.field },
				where: [ association.model.table, conditions ],
				table: Model.table
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

exports.extend = function (Model, Instance, Driver, associations, opts, cb) {
	if (associations.length === 0) {
		return cb();
	}

	var pending = associations.length;
	var extendDone = function extendDone() {
		pending -= 1;

		if (pending === 0) {
			return cb();
		}
	};

	for (var i = 0; i < associations.length; i++) {
		extendInstance(Model, Instance, Driver, associations[i], opts, extendDone);
	}
};

function extendInstance(Model, Instance, Driver, association, opts, cb) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value: function (opts, cb) {
			if (typeof opts == "function") {
				cb = opts;
				opts = {};
			}

			if (Instance[association.field]) {
				association.model.get(Instance[association.field], opts, function (err, instance) {
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
				if (Instance[Model.id]) {
					var conditions = {};
					conditions[association.field] = Instance[Model.id];
					association.model.find(conditions, opts, cb);
				} else {
					cb(null);
				}
			} else {
				if (Instance.isShell()) {
					Model.get(Instance[Model.id], function (err, instance) {
						if (err || !instance[association.field]) {
							return cb(null);
						}
						association.model.get(instance[association.field], opts, cb);
					});
				} else if (Instance[association.field]) {
					association.model.get(Instance[association.field], opts, cb);
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

					OtherInstance[association.field] = Instance[Model.id];

					return OtherInstance.save({}, { saveAssociations: false }, cb);
				});
			} else {
				OtherInstance.save({}, { saveAssociations: false }, function (err) {
					if (err) {
						return cb(err);
					}

					Instance[association.field] = OtherInstance[association.model.id];

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
				Instance[association.field] = null;
				Instance.save(cb);

				return this;
			},
			enumerable: false
		});
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
	if(Instance.isPersisted()) {
		Instance[association.getAccessor]({ autoFetchLimit: opts.autoFetchLimit - 1 }, function (err, Assoc) {
			if (!err) {
				Instance[association.name] = Assoc;
			}

			return cb();
		});
	}
}

function ucfirst(text) {
	return text[0].toUpperCase() + text.substr(1);
}
