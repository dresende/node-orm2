var RGX_COLON_SINGLE = /:(\w+)/g;
var RGX_COLON_DOUBLE = /::(\w+)/g;
module.exports = {
	execQuery: function () {
		if (arguments.length == 2) {
			var query = arguments[0];
			var cb    = arguments[1];
		} else if (arguments.length == 3) {
			var query = this.query.escape(arguments[0], arguments[1]);
			var cb    = arguments[2];
		}
		return this.execSimpleQuery(query, cb);
	},
	execNamedQuery: function (query, cb, obj, meta, unit_test, rgx) {
		var values = [];
		var rgx1 = (rgx && rgx.values) ? rgx.values : RGX_COLON_SINGLE;
		var rgx2 = (rgx && rgx.meta) ? rgx.meta : RGX_COLON_DOUBLE;
		if(meta){
			query = query.replace(rgx2, function(txt, key){ 
				if(meta.hasOwnProperty(key)){
					return meta[key];
				}
				return txt;
			});
		}
		if(obj){
			query = query.replace(rgx1, function(txt, key){ 
				if(obj.hasOwnProperty(key)){
						values.push(obj[key]);
						return '?';
				}
				return txt;
			});
		}
		if(unit_test){
			return {sql:query, values:values};
		}
		query = this.query.escape(query, values);
		return this.execSimpleQuery(query, cb);
	},
	eagerQuery: function (association, opts, keys, cb) {
		var desiredKey = Object.keys(association.field);
		var assocKey = Object.keys(association.mergeAssocId);

		var where = {};
		where[desiredKey] = keys;

		var query = this.query.select()
			.from(association.model.table)
			.select(opts.only)
			.from(association.mergeTable, assocKey, opts.keys)
			.select(desiredKey).as("$p")
			.where(association.mergeTable, where)
			.build();

		this.execSimpleQuery(query, cb);
	}
};
