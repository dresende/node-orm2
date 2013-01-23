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

Builder.prototype.count = function () {
	this.opts.count = true;

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
	// stand by for now..
	// if (!Array.isArray(value) && typeof(value) === 'object') {
	// 	comparison = value.op || value.operator || value.comp || value.comparison;
	// 	value = value.value;
	// }
	this.opts.where.push({
		field : field,
		value : value,
		comp  : comparison || (Array.isArray(value) ? "IN" : "=")
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
	// allow numbers but also strings (big numbers..)
	if (typeof limit == "number" || (limit && limit.length)) {
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

	if (this.opts.count) {
		query += "COUNT(*) AS c";
	} else if (Array.isArray(this.opts.fields)) {
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
		if (typeof this.opts.where[i].value.orm_special_object == "function") {
			var op = this.opts.where[i].value.orm_special_object();
			switch (op) {
				case "between":
					lst.push([
						this.escapeId(this.opts.where[i].field),
						"BETWEEN",
						this.escape(this.opts.where[i].value.from),
						"AND",
						this.escape(this.opts.where[i].value.to)
					].join(" "));
					break;
				case "eq":
				case "ne":
				case "gt":
				case "gte":
				case "lt":
				case "lte":
					switch (op) {
						case "eq"  : op = "=";  break;
						case "ne"  : op = "<>";  break;
						case "gt"  : op = ">";  break;
						case "gte" : op = ">="; break;
						case "lt"  : op = "<";  break;
						case "lte" : op = "<="; break;
					}
					lst.push([
						this.escapeId(this.opts.where[i].field),
						op,
						this.escape(this.opts.where[i].value.val)
					].join(" "));
					break;
			}
			continue;
		}
		lst.push([
			this.escapeId(this.opts.where[i].field),
			this.opts.where[i].comp,
			this.escape((this.opts.where[i].comp == "IN") ? [ this.opts.where[i].value ] : this.opts.where[i].value)
		].join(" "));
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
	} else if (this.opts.hasOwnProperty("offset")) {
		query += " OFFSET " + this.opts.offset;
	}

	return query;
};
