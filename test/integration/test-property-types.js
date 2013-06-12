var common     = require('../common');
var assert     = require('assert');
var Property   = require('../../lib/Property');
var Settings   = common.ORM.settings;

assert.equal(Property.standardize(String, Settings).type, "text");
assert.equal(Property.standardize(Number, Settings).type, "number");
assert.equal(Property.standardize(Boolean, Settings).type, "boolean");
assert.equal(Property.standardize(Date, Settings).type, "date");
assert.equal(Property.standardize(Object, Settings).type, "object");
assert.equal(Property.standardize(Buffer, Settings).type, "binary");
assert.equal(Property.standardize([ 'a', 'b' ], Settings).type, "enum");
assert.deepEqual(Property.standardize([ 'a', 'b' ], Settings).values, [ 'a', 'b' ]);

assert.equal({ type: "text" }.type, "text");
assert.equal({ type: "number" }.type, "number");
assert.equal({ type: "boolean" }.type, "boolean");
assert.equal({ type: "date" }.type, "date");
assert.equal({ type: "enum" }.type, "enum");
assert.equal({ type: "object" }.type, "object");
assert.equal({ type: "binary" }.type, "binary");

assert.throws(function () { Property.standardize({ type: "buffer" }, Settings); });
assert.throws(function () { Property.standardize({ type: "unknown" }, Settings); });
