var Mocha    = require('mocha');
var fs       = require('fs');
var path     = require('path');
var location = path.normalize(path.join(__dirname, "integration"));
var mocha    = new Mocha({
	reporter: "progress"
});

runTests();

function runTests() {
	fs.readdirSync(location).filter(function(file){
		return file.substr(-3) === '.js';
	}).forEach(function(file){
		mocha.addFile(
			path.join(location, file)
		);
	});

	process.stdout.write("\033[1;34m[i] \033[0;34mTesting \033[1;34m" + process.env.ORM_PROTOCOL + "\033[0m\n");
	process.stdout.write("\033[1;34m[i] \033[0;34mURI: \033[1;34m" + require('./common').getConnectionString() + "\033[0m\n");

	mocha.run(function (failures) {
		process.exit(failures);
	});
}
