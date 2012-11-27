module.exports = Builder;

function Builder(opts) {
	this.escapeId = opts.escapeId;
	this.escape   = opts.escape;
	this.clear();
}

Builder.prototype.clear = function () {
	this.opts = {
		table : [],
		merge : [],
		where : [],
		order : []
	};

	return this;
};

Builder.prototype.fields = function (fields) {
	this.opts.fields = fields;

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

Builder.prototype.merge = function (from, to) {
	this.opts.merge.push({
		from : from,
		to   : to
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
	var query = "SELECT ";

	if (Array.isArray(this.opts.fields)) {
		query += this.opts.fields.map(this.escapeId).join(", ");
	} else if (this.opts.fields) {
		query += this.escapeId(this.opts.fields);
	} else {
		query += "*";
	}

	query += " FROM ";

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

	if (this.opts.merge) {
		for (i = 0; i < this.opts.merge.length; i++) {
			query += " LEFT JOIN " + this.escapeId(this.opts.merge[i].from.table) +
			         " ON " + this.escapeId(this.opts.merge[i].from.table + "." + this.opts.merge[i].from.field) + " = " +
			         this.escapeId(this.opts.merge[i].to.table + "." + this.opts.merge[i].to.field);
		}
	}

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
