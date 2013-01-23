var InstanceConstructor = require("../Instance").Instance;
var Singleton           = require("../Singleton");

exports.prepare = function (Model, associations) {
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
		}

		var assocName = opts.name || name[0].toUpperCase() +
		                             name.substr(1, name.length).toLowerCase();

		associations.push({
			name           : name,
			model          : OtherModel || Model,
			props          : props,
			autoFetch      : opts.autoFetch || false,
			autoFetchLimit : opts.autoFetchLimit || 2,
			field          : opts.field || (name + "_id"),
			mergeTable     : opts.mergeTable || (Model.table + "_" + name),
			mergeId        : opts.mergeId || (Model.table + "_id"),
			mergeAssocId   : opts.mergeAssocId || (name + "_id"),
			getFunction    : opts.getFunction || ("get" + assocName),
			setFunction    : opts.setFunction || ("set" + assocName),
			hasFunction    : opts.hasFunction || ("has" + assocName),
			delFunction    : opts.delFunction || ("remove" + assocName),
			addFunction    : opts.addFunction || ("add" + assocName)
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
	Object.defineProperty(Instance, association.hasFunction, {
		value: function () {
			var Instances = Array.prototype.slice.apply(arguments);
			var cb = Instances.pop();
			var conditions = {}, options = {};

			options.__merge = {
				from: { table: association.mergeTable, field: association.mergeAssocId },
				to: { table: association.model.table, field: association.model.id }
			};
			options.extra = association.props;
			options.extra_info = {
				table: association.mergeTable,
				id: Instance.id,
				id_prop: association.mergeId,
				assoc_prop: association.mergeAssocId
			};

			conditions[association.mergeTable + "." + association.mergeId] = Instance.id;
			conditions[association.mergeTable + "." + association.mergeAssocId] = [];

			for (var i = 0; i < Instances.length; i++) {
				conditions[association.mergeTable + "." + association.mergeAssocId].push(Instances[i].id);
			}

			association.model.find(conditions, options, function (err, instances) {
				if (err) {
					return cb(err);
				}
				return cb(null, instances.length == Instances.length);
			});
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.getFunction, {
		value: function () {
			var conditions = null;
			var options = {};
			var limit;
			var cb = null;

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
					case "number":
						limit = arguments[i];
						break;
				}
			}

			options.__merge = {
				from: { table: association.mergeTable, field: association.mergeAssocId },
				to: { table: association.model.table, field: association.model.id }
			};
			options.extra = association.props;
			options.extra_info = {
				table: association.mergeTable,
				id: Instance.id,
				id_prop: association.mergeId,
				assoc_prop: association.mergeAssocId
			};

			if (conditions === null) {
				conditions = {};
			}
			conditions[association.mergeTable + "." + association.mergeId] = Instance.id;

			if (cb === null) {
				return association.model.find(conditions, limit, options);
			}
			association.model.find(conditions, limit, options, cb);
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.setFunction, {
		value: function () {
			var Instances = Array.prototype.slice.apply(arguments);
			var cb = Instances.pop();

			Instance[association.delFunction](function (err) {
				if (err) {
					return cb(err);
				}
				Instances.push(cb);
				Instance[association.addFunction].apply(Instance, Instances);
			});
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.delFunction, {
		value: function () {
			var Associations = Array.prototype.slice.apply(arguments);
			var cb = Associations.pop();
			var conditions = {};
			var associationIds = [];
			conditions[association.mergeId] = Instance.id;

			if (Associations.length === 0) {
				Driver.remove(association.mergeTable, conditions, cb);
				return this;
			}


			for (var i = 0; i < Associations.length; i++) {
				if (Associations[i].id) {
					associationIds.push(Associations[i].id);
				}
			}

			if (associationIds.length === 0) {
				return cb(null);
			}

			conditions[association.mergeAssocId] = associationIds;

			Driver.remove(association.mergeTable, conditions, cb);
			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.addFunction, {
		value: function () {
			var Associations = [];
			var opts = {};
			var cb;

			for (var i = 0; i < arguments.length; i++) {
				switch (typeof arguments[i]) {
					case "function":
						cb = arguments[i];
						break;
					case "object":
						if (arguments[i].isInstance) {
							Associations.push(arguments[i]);
						} else {
							opts = arguments[i];
						}
						break;
				}
			}

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
					data[association.mergeId] = Instance.id;
					data[association.mergeAssocId] = Association.id;

					for (var k in opts) {
						data[k] = opts[k];
					}

					Driver.insert(association.mergeTable, data, function (err) {
						if (err) {
							return cb(err);
						}

						return saveNextAssociation();
					});
				});
			};

			saveNextAssociation();

			return this;
		},
		enumerable: false
	});

	if (!opts.hasOwnProperty("autoFetchLimit") || typeof opts.autoFetchLimit == "undefined") {
		opts.autoFetchLimit = association.autoFetchLimit;
	}

	if (opts.autoFetchLimit === 0 || (!opts.autoFetch && !association.autoFetch)) {
		return cb();
	}

	Instance[association.getFunction]({}, { autoFetchLimit: opts.autoFetchLimit - 1 }, function (err, Assoc) {
		if (!err) {
			Instance[association.name] = Assoc;
		}

		return cb();
	});
}
