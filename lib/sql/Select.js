module.exports = Builder;

function Builder(opts) {
	this.escapeId = opts.escapeId;
	this.escape   = opts.escape;
	this.clear();
}

Builder.prototype.clear = function () {
	this.opts = {
		table : [],
		where : [],
		order : []
	};

	return this;
};

Builder.prototype.table = function (table) {
	this.opts.table.push(table);

	return this;
};

Builder.prototype.where = function (field, value, comparison) {
	this.opts.where.push({
		field : field,
		value : value,
		comp  : comparison || "="
	});

	return this;
};

Builder.prototype.order = function (field, order) {
	this.opts.order.push({
		field : field,
		order : order || "A"
	});

	return this;
};

Builder.prototype.limit = function (limit) {
	if (typeof limit == "number") {
		this.opts.limit = limit;
	} else {
		delete this.opts.limit;
	}

	return this;
};

Builder.prototype.offset = function (offset) {
	if (typeof offset == "number") {
		this.opts.offset = offset;
	} else {
		delete this.opts.offset;
	}

	return this;
};

Builder.prototype.build = function () {
	var i, lst;
	var query = "SELECT * FROM ";

	// tables
	lst = [];
	for (i = 0; i < this.opts.table.length; i++) {
		if (Array.isArray(this.opts.table[i])) {
			lst.push(this.opts.table[i].map(this.escapeId).join(" JOIN "));
		} else {
			lst.push(this.escapeId(this.opts.table[i]));
		}
	}
	query += lst.join(", ");

	// where
	lst = [];
	for (i = 0; i < this.opts.where.length; i++) {
		lst.push([ this.escapeId(this.opts.where[i].field), this.opts.where[i].comp, this.escape(this.opts.where[i].value) ].join(" "));
	}

	if (lst.length > 0) {
		query += " WHERE " + lst.join(" AND ");
	}

	// order
	if (this.opts.hasOwnProperty("order")) {
		if (Array.isArray(this.opts.order)) {
			lst = [];

			for (i = 0; i < this.opts.order.length; i++) {
				lst.push(this.escapeId(this.opts.order[i].field) +
				         (this.opts.order[i].order.toLowerCase() == "z" ? " DESC" : " ASC"));
			}

			if (lst.length > 0) {
				query += " ORDER BY " + lst.join(", ");
			}
		} else {
			query += " ORDER BY " + this.escapeId(this.opts.order);
		}
	}

	// limit
	if (this.opts.hasOwnProperty("limit")) {
		if (this.opts.hasOwnProperty("offset")) {
			query += " LIMIT " + this.opts.limit + " OFFSET " + this.opts.offset;
		} else {
			query += " LIMIT " + this.opts.limit;
		}
	}

	return query;
};
