var Mocha    = require("mocha");
var fs       = require("fs");
var path     = require("path");
var common   = require("./common");
var logging  = require("./logging");
var location = path.normalize(path.join(__dirname, "integration"));
var mocha    = new Mocha({
	reporter: "progress"
});

switch (common.hasConfig(common.protocol())) {
	case 'not-defined':
		logging.error("There's no configuration for protocol **%s**", common.protocol());
		process.exit(0);
	case 'not-found':
		logging.error("**test/config.js** missing. Take a look at **test/config.example.js**");
		process.exit(0);
}

runTests();

function runTests() {
	fs.readdirSync(location).filter(function (file) {
		return file.substr(-3) === '.js';
	}).forEach(function (file) {
		if (!shouldRunTest(file)) return;

		mocha.addFile(
			path.join(location, file)
		);
	});

	logging.info("Testing **%s**", common.getConnectionString());

	mocha.run(function (failures) {
		process.exit(failures);
	});
}

function shouldRunTest(file) {
	var name  = file.substr(0, file.length - 3);
	var proto = common.protocol();

	if (proto == "mongodb" && [ "model-aggregate",
	                            "property-number-size", "smart-types" ].indexOf(name) >= 0) return false;

	return true;
}
