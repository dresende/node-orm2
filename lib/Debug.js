var util = require("util");
var tty  = require("tty");

exports.sql = function (driver, sql) {
  var fmt;

  if (tty.isatty(process.stdout)) {
    fmt = "\033[32;1m(orm/%s) \033[34m%s\033[0m\n";
    sql = sql.replace(/`(.+?)`/g, function (m) { return "\033[31m" + m + "\033[34m"; });
  } else {
    fmt = "[SQL/%s] %s\n";
  }

  process.stdout.write(util.format(fmt, driver, sql));
};
