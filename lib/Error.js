var codes = {
  QUERY_ERROR      : 1,
  NOT_FOUND        : 2,
  NOT_DEFINED      : 3,
  NO_SUPPORT       : 4,
  MISSING_CALLBACK : 5,
  PARAM_MISMATCH   : 6,
  CONNECTION_LOST  : 10,
  BAD_MODEL        : 15
};

function ORMError(message, code, extras) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);

  this.message = message;
  if (code) {
    this.code = codes[code];
    this.literalCode = code;
    if (!this.code) {
      throw new Error("Invalid error code: " +  code);
    }
  }
  if (extras) {
    for(var k in extras) {
      this[k] = extras[k];
    }
  }
}

ORMError.prototype = Object.create(Error.prototype);
ORMError.prototype.constructor = ORMError;
ORMError.prototype.name        = 'ORMError';
ORMError.prototype.toString    = function () {
  return '[ORMError ' + this.literalCode + ': ' + this.message + ']';
}

ORMError.codes = codes;

module.exports = ORMError;
