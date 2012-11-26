module.exports = Builder;

function Builder(opts) {
	this.escapeId = opts.escapeId;
	this.escape   = opts.escape;
	this.clear();
}

Builder.prototype.clear = function () {
	this.opts = {
		set   : []
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

Builder.prototype.build = function () {
	var i, lst;
	var query = "INSERT INTO " + this.escapeId(this.opts.table);

	// keys
	lst = [];
	for (i = 0; i < this.opts.set.length; i++) {
		lst.push(this.escapeId(this.opts.set[i].field));
	}
	query += " (" + lst.join(", ") + ")";

	// values
	lst = [];
	for (i = 0; i < this.opts.set.length; i++) {
		lst.push(this.escape(this.opts.set[i].value));
	}
	query += " VALUES (" + lst.join(", ") + ")";

	return query;
};
