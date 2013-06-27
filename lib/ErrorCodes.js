exports.QUERY_ERROR      = 1;
exports.NOT_FOUND        = 2;
exports.NO_SUPPORT       = 3;
exports.MISSING_CALLBACK = 4;
exports.PARAM_MISSMATCH  = 5;

Object.defineProperty(exports, "generateError", {
	value: function (code, message, extra) {
		var err = new Error(message);
		err.code = code;

		if (extra) {
			for (var k in extra) {
				err[k] = extra[k];
			}
		}

		return err;
	},
	enumerable : false
});
