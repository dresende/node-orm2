exports.extend = function (Instance, Model, properties) {
	for (var k in properties) {
		if (properties[k].lazyload === true) {
			addLazyLoadProperty(properties[k].lazyname || k, Instance, Model, k);
		}
	}
};

function addLazyLoadProperty(name, Instance, Model, property) {
	var method = ucfirst(name);

	Object.defineProperty(Instance, "get" + method, {
		value: function (cb) {
			var conditions = {};
			conditions[Model.id] = Instance.id;

			Model.find(conditions, { cache: false }).only(property).first(function (err, item) {
				return cb(err, item ? item[property] : null);
			});

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, "remove" + method, {
		value: function (cb) {
			var conditions = {};
			conditions[Model.id] = Instance.id;

			Model.find(conditions, { cache: false }).only(property).first(function (err, item) {
				if (err) {
					return cb(err);
				}
				if (!item) {
					return cb(null);
				}

				item[Model.id] = Instance.id;
				item[property] = null;
				return item.save(cb);
			});

			return this;
		},
		enumerable: false
	});
	Object.defineProperty(Instance, "set" + method, {
		value: function (data, cb) {
			var conditions = {};
			conditions[Model.id] = Instance.id;

			Model.find(conditions, { cache: false }).only(property).first(function (err, item) {
				if (err) {
					return cb(err);
				}
				if (!item) {
					return cb(null);
				}

				item[Model.id] = Instance.id;
				item[property] = data;
				return item.save(cb);
			});

			return this;
		},
		enumerable: false
	});
}

function ucfirst(text) {
	return text[0].toUpperCase() + text.substr(1).toLowerCase();
}
