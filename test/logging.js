var util = require("util");

exports.info = buildMethod(process.stdout, "[i]", 34);
exports.error = buildMethod(process.stderr, "[!]", 31);

function buildMethod(stream, prefix, color) {
	return function () {
		var params = Array.prototype.slice.apply(arguments);
		var text   = params.shift();

		return printTo(stream, prefix + " ", color, text, params);
	};
}

function printTo(stream, prefix, color, text, params) {
	params.unshift(text);
	text = util.format.apply(util, params);

	stream.write(printColor(color, true) + prefix + printColor(color) + text.replace(/\*\*(.+?)\*\*/, function (m, t) {
		return printColor(color, true) + t + printColor(color);
	}) + printColor(null) + "\n");
}

function printColor(color, bold) {
	if (color === null) {
		return "\033[0m";
	}
	return "\033[" + (bold ? "1" : "0") + ";" + color + "m";
}
