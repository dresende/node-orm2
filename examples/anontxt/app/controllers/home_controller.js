var settings = require('../../config/settings');

module.exports = function (req, res, next) {
  res.sendfile(settings.path + '/public/index.html');
};
