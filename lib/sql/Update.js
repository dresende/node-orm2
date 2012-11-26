module.exports = Builder;

function Builder(opts) {
	this.escapeId = opts.escapeId;
	this.escape   = opts.escape;
	this.clear();
}

Builder.prototype.clear = function () {
	this.opts = {
		set   : [],
		where : []
	};

	return this;
};

Builder.prototype.table = function (table) {
	this.opts.table = table;

	return this;
};

Builder.prototype.set = function (field, value) {
	this.opts.set.push({
		field : field,
		value : value
	});

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
	var query = "UPDATE " + this.escapeId(this.opts.table);

	// set
	lst = [];
	for (i = 0; i < this.opts.set.length; i++) {
		lst.push([ this.escapeId(this.opts.set[i].field), this.escape(this.opts.set[i].value) ].join(" = "));
	}
	if (lst.length > 0) {
		query += " SET " + lst.join(", ");
	}

	// where
	lst = [];
	for (i = 0; i < this.opts.where.length; i++) {
		lst.push([ this.escapeId(this.opts.where[i].field), this.opts.where[i].comp, this.escape(this.opts.where[i].value) ].join(" "));
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
