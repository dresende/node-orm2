var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path'),
    mocha = null,
    location = null;
var options = {};

function runClassicTests() {
  if (process.env.FILTER) {
    options.include = new RegExp(process.env.FILTER + '.*\\.js$');
  }
  process.stdout.write("\033[1;34m[i] \033[0;34mTesting \033[1;34m" + process.env.ORM_PROTOCOL + "\033[0m\n");
  process.stdout.write("\033[1;34m[i] \033[0;34mURI: \033[1;34m" + require('./common').getConnectionString() + "\033[0m\n");

  require('urun')(__dirname, options);
}

location = path.normalize(path.join(__dirname, 'integration2'));
mocha    = new Mocha({reporter: 'nyan'});

fs.readdirSync(location).filter(function(file){
  return file.substr(-3) === '.js';
}).forEach(function(file){
  mocha.addFile(
    path.join(location, file)
  );
});

mocha.run(function(failures){
  if (failures > 0) {
    process.exit(failures);
  } else {
    runClassicTests();
  }
});

