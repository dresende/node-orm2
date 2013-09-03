exports.QUERY_ERROR      = 1;
exports.NOT_FOUND        = 2;
exports.NOT_DEFINED      = 3;
exports.NO_SUPPORT       = 4;
exports.MISSING_CALLBACK = 5;
exports.PARAM_MISMATCH   = 6;

exports.CONNECTION_LOST  = 10;

// Deprecated, remove on next major release.
Object.defineProperty(exports, "PARAM_MISSMATCH", {
  enumerable: true, get: function () {
    console.log("PARAM_MISSMATCH spelling is deprecated. Use PARAM_MISMATCH instead");
    return exports.PARAM_MISMATCH;
  }
});

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
