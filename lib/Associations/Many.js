var InstanceConstructor = require("../Instance").Instance;
var Settings            = require("../Settings");
var Property            = require("../Property");
var ErrorCodes          = require("../ErrorCodes");
var _                   = require("lodash");

exports.prepare = function (Model, associations) {
	if (Model.keys.length > 1) {
		Model.hasMany = function () {
			throw ErrorCodes.generateError(ErrorCodes.NO_SUPPORT, "Model.hasMany() does not support multiple keys models");
		};
		return;
	}

	Model.hasMany = function () {
		var name;
		var OtherModel = Model;
		var props = null;
		var opts = {};

		for (var i = 0; i < arguments.length; i++) {
			switch (typeof arguments[i]) {
				case "string":
					name = arguments[i];
					break;
				case "function":
					OtherModel = arguments[i];
					break;
				case "object":
					if (props === null) {
						props = arguments[i];
					} else {
						opts = arguments[i];
					}
					break;
			}
		}
		if (props === null) {
			props = {};
		} else {
			for (var k in props) {
				props[k] = Property.normalize(props[k], Model.settings);
			}
		}

		var assocName = opts.name || ucfirst(name);
		var association = {
			name           : name,
			model          : OtherModel || Model,
			props          : props,
			autoFetch      : opts.autoFetch || false,
			autoFetchLimit : opts.autoFetchLimit || 2,
			// I'm not sure the next key is used..
			field          : opts.field || Model.settings.get("properties.association_key").replace("{name}", name),
			mergeTable     : opts.mergeTable || (Model.table + "_" + name),
			mergeId        : opts.mergeId || Model.settings.get("properties.association_key").replace("{name}", Model.table),
			mergeAssocId   : opts.mergeAssocId || Model.settings.get("properties.association_key").replace("{name}", name),
			getAccessor    : opts.getAccessor || ("get" + assocName),
			setAccessor    : opts.setAccessor || ("set" + assocName),
			hasAccessor    : opts.hasAccessor || ("has" + assocName),
			delAccessor    : opts.delAccessor || ("remove" + assocName),
			addAccessor    : opts.addAccessor || ("add" + assocName)
		};
		associations.push(association);

		if (opts.reverse) {
			OtherModel.hasMany(opts.reverse, Model, association.props, {
				reversed       : true,
				mergeTable     : association.mergeTable,
				mergeId        : association.mergeAssocId,
				mergeAssocId   : association.mergeId,
				field          : association.field,
				autoFetch      : association.autoFetch,
				autoFetchLimit : association.autoFetchLimit
			});
		}
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
	if (Model.settings.get("instance.cascadeRemove")) {
		Instance.on("beforeRemove", function () {
			Instance[association.delAccessor]();
		});
	}

	Object.defineProperty(Instance, association.hasAccessor, {
		value: function () {
			var Instances = Array.prototype.slice.apply(arguments);
			var cb = Instances.pop();
			var conditions = {}, options = {};

			options.__merge = {
				from: { table: association.mergeTable, field: association.mergeAssocId },
				to: { table: association.model.table, field: association.model.id },
				where: [ association.mergeTable, {} ]
			};
			options.extra = association.props;
			options.extra_info = {
				table: association.mergeTable,
				id: Instance[Model.id],
				id_prop: association.mergeId,
				assoc_prop: association.mergeAssocId
			};

			options.__merge.where[1][association.mergeId] = Instance[Model.id];

			if (Instances.length) {
				if (Array.isArray(Instances[0])) {
					Instances = Instances[0];
				}
				options.__merge.where[1][association.mergeAssocId] = [];

				for (var i = 0; i < Instances.length; i++) {
					options.__merge.where[1][association.mergeAssocId].push(Instances[i][association.model.id]);
				}
			}

			association.model.find(conditions, options, function (err, instances) {
				if (err) {
					return cb(err);
				}
				if (!Instances.length) {
					return cb(null, instances.length > 0);
				}
				return cb(null, instances.length == Instances.length);
			});
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.getAccessor, {
		value: function () {
			var options    = {};
			var conditions = null;
			var order      = null;
			var cb         = null;

			for (var i = 0; i < arguments.length; i++) {
				switch (typeof arguments[i]) {
					case "function":
						cb = arguments[i];
						break;
					case "object":
						if (Array.isArray(arguments[i])) {
							order = arguments[i];
							order[0] = [ association.model.table, order[0] ];
						} else {
							if (conditions === null) {
								conditions = arguments[i];
							} else {
								options = arguments[i];
							}
						}
						break;
					case "string":
						if (arguments[i][0] == "-") {
							order = [ [ association.model.table, arguments[i].substr(1) ], "Z" ];
						} else {
							order = [ [ association.model.table, arguments[i] ] ];
						}
						break;
					case "number":
						options.limit = arguments[i];
						break;
				}
			}

			options.__merge = {
				from  : { table: association.mergeTable, field: association.mergeAssocId },
				to    : { table: association.model.table, field: association.model.id },
				where : [ association.mergeTable, {} ]
			};
			options.extra = association.props;
			options.extra_info = {
				table: association.mergeTable,
				id: Instance[Model.id],
				id_prop: association.mergeId,
				assoc_prop: association.mergeAssocId
			};
			if (order !== null) {
				options.order = order;
			}

			if (conditions === null) {
				conditions = {};
			}

			options.__merge.where[1][association.mergeId] = Instance[Model.id];

			if (cb === null) {
				return association.model.find(conditions, options);
			}

			association.model.find(conditions, options, cb);
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.setAccessor, {
		value: function () {
			var Instances = Array.prototype.slice.apply(arguments);
			var cb        = (Instances.length &&
			                 typeof Instances[Instances.length - 1] == "function" ? Instances.pop() : noOperation);

			if (Instances.length === 0) {
				throw ErrorCodes.generateError(ErrorCodes.PARAM_MISSMATCH, "No associations defined");
			}

			if (Array.isArray(Instances[0])) {
				// clone is used or else Instances will be just a reference
				// to the array and the Instances.push(cb) a few lines ahead
				// would actually change the user Array passed to the function
				Instances = _.clone(Instances[0]);
			}

			Instance[association.delAccessor](function (err) {
				if (err) {
					return cb(err);
				}
				Instances.push(cb);
				Instance[association.addAccessor].apply(Instance, Instances);
			});
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.delAccessor, {
		value: function () {
			var Associations = Array.prototype.slice.apply(arguments);
			var cb = (typeof Associations[Associations.length - 1] == "function" ? Associations.pop() : noOperation);
			var conditions = {};
			var associationIds = [];
			var run = function () {
				if (Associations.length === 0) {
					return Driver.remove(association.mergeTable, conditions, cb);
				}

				for (var i = 0; i < Associations.length; i++) {
					if (Associations[i][association.model.id]) {
						associationIds.push(Associations[i][association.model.id]);
					}
				}

				if (associationIds.length === 0) {
					return cb(null);
				}

				conditions[association.mergeAssocId] = associationIds;

				Driver.remove(association.mergeTable, conditions, cb);
			};
			conditions[association.mergeId] = Instance[Model.id];

			if (this.saved()) {
				run();
			} else {
				this.save(function (err) {
					if (err) {
						return cb(err);
					}

					return run();
				});
			}
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.addAccessor, {
		value: function () {
			var Associations = [];
			var opts = {};
			var cb = noOperation;
			var run = function () {
				var saveNextAssociation = function () {
					if (Associations.length === 0) {
						return cb();
					}

					var Association = Associations.pop();

					Association.save(function (err) {
						if (err) {
							return cb(err);
						}

						var data = {};
						data[association.mergeId] = Instance[Model.id];
						data[association.mergeAssocId] = Association[association.model.id];

						for (var k in opts) {
							data[k] = opts[k];
						}

						Driver.insert(association.mergeTable, data, null, function (err) {
							if (err) {
								return cb(err);
							}

							return saveNextAssociation();
						});
					});
				};

				return saveNextAssociation();
			};

			for (var i = 0; i < arguments.length; i++) {
				switch (typeof arguments[i]) {
					case "function":
						cb = arguments[i];
						break;
					case "object":
						if (Array.isArray(arguments[i])) {
							Associations = Associations.concat(arguments[i]);
						} else if (arguments[i].isInstance) {
							Associations.push(arguments[i]);
						} else {
							opts = arguments[i];
						}
						break;
				}
			}

			if (Associations.length === 0) {
				throw ErrorCodes.generateError(ErrorCodes.PARAM_MISSMATCH, "No associations defined");
			}

			if (this.saved()) {
				run();
			} else {
				this.save(function (err) {
					if (err) {
						return cb(err);
					}

					return run();
				});
			}

			return this;
		},
		enumerable: false
	});
}

function autoFetchInstance(Instance, association, opts, cb) {
	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit == "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
		return cb();
	}

	Instance[association.getAccessor]({}, { autoFetchLimit: opts.autoFetchLimit - 1 }, function (err, Assoc) {
		if (!err) {
			Instance[association.name] = Assoc;
		}

		return cb();
	});
}

function ucfirst(text) {
	return text[0].toUpperCase() + text.substr(1).replace(/_([a-z])/, function (m, l) {
		return l.toUpperCase();
	});
}

function noOperation() {
}
