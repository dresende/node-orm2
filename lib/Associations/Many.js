var InstanceConstructor = require("../Instance").Instance;
var Singleton           = require("../Singleton");

exports.prepare = function (Model, associations) {
	Model.hasMany = function (name, OtherModel, opts) {
		if (typeof OtherModel == "object" && !OtherModel.table) {
			opts = OtherModel;
			OtherModel = null;
		}
		opts = opts || {};

		var assocName = opts.name || name[0].toUpperCase() +
		                             name.substr(1, name.length).toLowerCase();

		associations.push({
			name         : name,
			model        : OtherModel || Model,
			mergeTable   : opts.mergeTable || (Model.table + "_" + name),
			mergeId      : opts.mergeId || (Model.table + "_id"),
			mergeAssocId : opts.mergeAssocId || (name + "_id"),
			field        : opts.field || (name + "_id"),
			autoFetch    : opts.autoFetch || false,
			getFunction  : opts.getFunction || ("get" + assocName),
			setFunction  : opts.setFunction || ("set" + assocName),
			addFunction  : opts.addFunction || ("add" + assocName)
		});
		return this;
	};
};

exports.extend = function (Instance, Driver, associations, opts, cb) {
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
		extendInstance(Instance, Driver, associations[i], opts, extendDone);
	}
};

function extendInstance(Instance, Driver, association, opts, cb) {
	Object.defineProperty(Instance, association.getFunction, {
		value: function (cb) {
			var conditions = {};
			conditions[association.mergeTable + "." + association.mergeId] = Instance.id;
			conditions.__merge = {
				from: { table: association.mergeTable, field: association.mergeAssocId },
				to: { table: association.model.table, field: "id" }
			};

			association.model.find(conditions, cb);
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.setFunction, {
		value: function () {
			var Instances = Array.prototype.slice.apply(arguments);
			var cb = Instances.pop();
			var conditions = {};

			conditions[association.mergeId] = Instance.id;

			Driver.remove(association.mergeTable, conditions, function (err) {
				if (err) {
					return cb(err);
				}

				var pending = Instances.length;
				var _err = null;

				if (pending === 0) {
					return cb(null);
				}

				conditions = {};
				conditions[association.mergeId] = Instance.id;

				for (var i = 0; i < Instances.length; i++) {
					conditions[association.mergeAssocId] = Instances[i].id;

					Driver.insert(association.mergeTable, conditions, function (err) {
						if (err && !_err) {
							_err = err;
						}

						pending -= 1;
						if (pending === 0) {
							return cb(_err);
						}
					});
				}
			});
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.addFunction, {
		value: function (Association, opts, cb) {
			if (typeof opts == "function") {
				cb = opts;
				opts = {};
			}
			opts = opts || {};

			Association.save(function (err) {
				if (err) {
					return cb(err);
				}

				var data = {};
				data[association.mergeId] = Instance.id;
				data[association.mergeAssocId] = Association.id;

				for (var k in opts) {
					data[k] = opts[k];
				}

				Driver.insert(association.mergeTable, data, function (err) {
					if (err) {
						return cb(err);
					}

					return cb(null);
				});
			});
			return this;
		},
		enumerable: false
	});

	if (!opts.autoFetch && !association.autoFetch) {
		return cb();
	}

	Instance[association.getFunction](function (err, Assoc) {
		if (!err) {
			Instance[association.name] = Assoc;
		}

		return cb();
	});
}
