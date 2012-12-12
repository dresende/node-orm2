exports.prepare = function (Model, associations, association_properties) {
	Model.hasOne = function (name, OtherModel, opts) {
		if (typeof OtherModel == "object" && !OtherModel.table) {
			opts = OtherModel;
			OtherModel = null;
		}
		opts = opts || {};

		var assocName = opts.name || name[0].toUpperCase() +
		                             name.substr(1, name.length).toLowerCase();
		var association = {
			name           : name,
			model          : OtherModel || Model,
			field          : opts.field || (name + "_id"),
			autoFetch      : opts.autoFetch || false,
			autoFetchLimit : opts.autoFetchLimit || 2,
			getFunction    : opts.getFunction || ("get" + assocName),
			setFunction    : opts.setFunction || ("set" + assocName),
			delFunction    : opts.delFunction || ("remove" + assocName)
		};
		associations.push(association);
		association_properties.push(association.field);
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
		value: function (opts, cb) {
			if (typeof opts == "function") {
				cb = opts;
				opts = {};
			}

			if (Instance[association.field] > 0) {
				association.model.get(Instance[association.field], cb);
			} else {
				cb();
			}

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.setFunction, {
		value: function (OtherInstance, cb) {
			OtherInstance.save(function (err) {
				if (err) {
					return cb(err);
				}

				Instance[association.field] = OtherInstance.id;

				return Instance.save(cb);
			});

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, association.delFunction, {
		value: function (cb) {
			Instance[association.field] = 0;
			Instance.save(cb);

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

	Instance[association.getFunction]({ autoFetchLimit: opts.autoFetchLimit - 1 }, function (err, Assoc) {
		if (!err) {
			Instance[association.name] = Assoc;
		}

		return cb();
	});
}
