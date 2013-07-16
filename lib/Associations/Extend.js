var ErrorCodes = require("../ErrorCodes");
var Settings   = require("../Settings");
var Singleton = require("../Singleton");
var _ = require('lodash');
var util = require("../Utilities");

exports.prepare = function (db, Model, associations, association_properties, model_fields) {
	Model.extendsTo = function (name, properties, opts) {
		opts = opts || {};

		var assocName = opts.name || ucfirst(name);
		var association = {
			name           : name,
			reversed       : opts.reversed,
			autoFetch      : opts.autoFetch || false,
			autoFetchLimit : opts.autoFetchLimit || 2,
			field          : util.wrapFieldObject(opts.field, Model, Model.table, Model.properties) || util.formatField(Model, Model.table, false, false),
			getAccessor    : opts.getAccessor || ("get" + assocName),
			setAccessor    : opts.setAccessor || ("set" + assocName),
			hasAccessor    : opts.hasAccessor || ("has" + assocName),
			delAccessor    : opts.delAccessor || ("remove" + assocName)
		};

		var newproperties = _.cloneDeep(properties);
		for (var k in association.field) {
		    newproperties[k] = association.field[k];
		}

		association.model = db.define(Model.table + "_" + name, newproperties, {
			id        : Object.keys(association.field),
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

function extendInstance(Model, Instance, Driver, association, opts) {
	Object.defineProperty(Instance, association.hasAccessor, {
		value : function (cb) {
			if (!Instance[Model.id]) {
				cb(ErrorCodes.generateError(ErrorCodes.NOT_DEFINED, "Instance not saved, cannot get extension"));
			} else {
			    association.model.get(util.values(Instance, Model.id), function (err, extension) {
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
			    association.model.get(util.values(Instance, Model.id), cb);
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

					var fields = Object.keys(association.field);

					for (var i = 0; i < Model.id.length; i++) {
						Extension[fields[i]] = Instance[Model.id[i]];
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
				var fields = Object.keys(association.field);

				for (var i = 0; i < Model.id.length; i++) {
				    conditions[fields[i]] = Instance[Model.id[i]];
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
