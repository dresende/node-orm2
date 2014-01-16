var Mocha    = require("mocha");
var glob     = require("glob");
var path     = require("path");
var common   = require("./common");
var logging  = require("./logging");
var location = path.normalize(path.join(__dirname, "integration", "**", "*.js"));
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
	glob.sync(location).forEach(function (file) {
		if (!shouldRunTest(file)) return;
		mocha.addFile(file);
	});

	logging.info("Testing **%s**", common.getConnectionString());

	mocha.run(function (failures) {
		process.exit(failures);
	});
}

function shouldRunTest(file) {
	var name  = path.basename(file).slice(0, -3)
	var proto = common.protocol();
	var exclude = ['model-aggregate','property-number-size','smart-types'];

	if (proto == "mongodb" && exclude.indexOf(name) >= 0) return false;

	return true;
}
