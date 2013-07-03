exports.QUERY_ERROR      = 1;
exports.NOT_FOUND        = 2;
exports.NOT_DEFINED      = 3;
exports.NO_SUPPORT       = 4;
exports.MISSING_CALLBACK = 5;
exports.PARAM_MISSMATCH  = 6;

exports.CONNECTION_LOST  = 10;

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
