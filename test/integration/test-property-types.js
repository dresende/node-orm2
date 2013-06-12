var common     = require('../common');
var assert     = require('assert');
var Property   = require('../../lib/Property');
var Settings   = common.ORM.settings;

assert.equal(Property.normalize(String, Settings).type, "text");
assert.equal(Property.normalize(Number, Settings).type, "number");
assert.equal(Property.normalize(Boolean, Settings).type, "boolean");
assert.equal(Property.normalize(Date, Settings).type, "date");
assert.equal(Property.normalize(Object, Settings).type, "object");
assert.equal(Property.normalize(Buffer, Settings).type, "binary");
assert.equal(Property.normalize([ 'a', 'b' ], Settings).type, "enum");
assert.deepEqual(Property.normalize([ 'a', 'b' ], Settings).values, [ 'a', 'b' ]);

assert.equal({ type: "text" }.type, "text");
assert.equal({ type: "number" }.type, "number");
assert.equal({ type: "boolean" }.type, "boolean");
assert.equal({ type: "date" }.type, "date");
assert.equal({ type: "enum" }.type, "enum");
assert.equal({ type: "object" }.type, "object");
assert.equal({ type: "binary" }.type, "binary");

assert.throws(function () { Property.normalize({ type: "buffer" }, Settings); });
assert.throws(function () { Property.normalize({ type: "unknown" }, Settings); });
