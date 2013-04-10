var common     = require('../common');
var assert     = require('assert');
var Property   = require('../../lib/Property');
var Settings   = common.ORM.settings;

assert.equal(Property.check(String, Settings).type, "text");
assert.equal(Property.check(Number, Settings).type, "number");
assert.equal(Property.check(Boolean, Settings).type, "boolean");
assert.equal(Property.check(Date, Settings).type, "date");
assert.equal(Property.check(Object, Settings).type, "object");
assert.equal(Property.check(Buffer, Settings).type, "binary");
assert.equal(Property.check([ 'a', 'b' ], Settings).type, "enum");
assert.deepEqual(Property.check([ 'a', 'b' ], Settings).values, [ 'a', 'b' ]);

assert.equal({ type: "text" }.type, "text");
assert.equal({ type: "number" }.type, "number");
assert.equal({ type: "boolean" }.type, "boolean");
assert.equal({ type: "date" }.type, "date");
assert.equal({ type: "enum" }.type, "enum");
assert.equal({ type: "object" }.type, "object");
assert.equal({ type: "binary" }.type, "binary");

assert.throws(function () { Property.check({ type: "buffer" }, Settings); });
assert.throws(function () { Property.check({ type: "unknown" }, Settings); });
