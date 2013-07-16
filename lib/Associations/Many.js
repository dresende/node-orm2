var InstanceConstructor = require("../Instance").Instance;
var Settings            = require("../Settings");
var Property            = require("../Property");
var ErrorCodes          = require("../ErrorCodes");
var _ = require("lodash");
var util = require("../Utilities");

exports.prepare = function (Model, associations) {
    if (Model.id.length > 1) {
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
			field          : util.wrapFieldObject(opts.field, OtherModel, Model.table, OtherModel.properties) || util.formatField(Model, name, true, opts.reversed),
			mergeTable     : opts.mergeTable || (Model.table + "_" + name),
			mergeId        : util.wrapFieldObject(opts.mergeId, OtherModel, Model.table, OtherModel.properties) || util.formatField(OtherModel, Model.table, true, opts.reversed),
			mergeAssocId   : util.wrapFieldObject(opts.mergeAssocId, Model, name, Model.properties) || util.formatField(Model, name, true, opts.reversed),
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
				from:   { table: association.mergeTable, field: Object.keys(association.mergeAssocId) },
				to: { table: association.model.table, field: association.model.id },
				where:  [ association.mergeTable, {} ]
			};
			options.extra = association.props;
			options.extra_info = {
				table: association.mergeTable,
				id: util.values(Instance, Model.id),
				id_prop: Object.keys(association.mergeId),
				assoc_prop: Object.keys(association.mergeAssocId)
			};

			util.populateConditions(Model, Object.keys(association.mergeId), Instance, options.__merge.where[1]);

			if (Instances.length) {
				if (Array.isArray(Instances[0])) {
					Instances = Instances[0];
				}

				for (var i = 0; i < Instances.length; i++) {
					util.populateConditions(association.model, Object.keys(association.mergeAssocId), Instances[i], options.__merge.where[1], false);
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
				from  : { table: association.mergeTable, field: Object.keys(association.mergeAssocId) },
				to    : { table: association.model.table, field: association.model.id },
				where : [ association.mergeTable, {} ]
			};
			options.extra = association.props;
			options.extra_info = {
				table: association.mergeTable,
				id: util.values(Instance, Model.id),
				id_prop: Object.keys(association.mergeId),
				assoc_prop: Object.keys(association.mergeAssocId)
			};
			if (order !== null) {
				options.order = order;
			}

			if (conditions === null) {
				conditions = {};
			}

			util.populateConditions(Model, Object.keys(association.mergeId), Instance, options.__merge.where[1]);

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
			var run = function () {
				if (Associations.length === 0) {
					return Driver.remove(association.mergeTable, conditions, cb);
				}
				
				for (var i = 0; i < Associations.length; i++) {				    
					util.populateConditions(association.model, Object.keys(association.mergeAssocId), Associations[i], conditions, false);
				}

				Driver.remove(association.mergeTable, conditions, cb);
			};
            
			util.populateConditions(Model, Object.keys(association.mergeId), Instance, conditions);

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
						util.populateConditions(Model, Object.keys(association.mergeId), Instance, data);
						util.populateConditions(association.model, Object.keys(association.mergeAssocId), Association, data);

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
