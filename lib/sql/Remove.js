module.exports = Builder;

function Builder(opts) {
	this.escapeId = opts.escapeId;
	this.escape   = opts.escape;
	this.clear();
}

Builder.prototype.clear = function () {
	this.opts = {
		where : []
	};

	return this;
};

Builder.prototype.table = function (table) {
	this.opts.table = table;

	return this;
};

Builder.prototype.where = function (field, value, comparison) {
	this.opts.where.push({
		field : field,
		value : value,
		comp  : comparison || (Array.isArray(value) ? "IN" : "=")
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

Builder.prototype.build = function () {
	var i, lst;
	var query = "DELETE FROM " + this.escapeId(this.opts.table);

	// where
	lst = [];
	for (i = 0; i < this.opts.where.length; i++) {
		lst.push([
			this.escapeId(this.opts.where[i].field),
			this.opts.where[i].comp,
			this.escape((this.opts.where[i].comp == "IN") ? [ this.opts.where[i].value ] : this.opts.where[i].value)
		].join(" "));
	}
	if (lst.length > 0) {
		query += " WHERE " + lst.join(" AND ");
	}

	// limit
	if (this.opts.hasOwnProperty("limit")) {
		query += " LIMIT " + this.opts.limit;
	}

	return query;
};
