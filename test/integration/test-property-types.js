var common     = require('../common');
var assert     = require('assert');
var Property   = require('../../lib/Property');

assert.equal(Property.check(String).type, "text");
assert.equal(Property.check(Number).type, "number");
assert.equal(Property.check(Boolean).type, "boolean");
assert.equal(Property.check(Date).type, "date");
assert.equal(Property.check(Object).type, "object");
assert.equal(Property.check(Buffer).type, "binary");
assert.equal(Property.check([ 'a', 'b' ]).type, "enum");
assert.deepEqual(Property.check([ 'a', 'b' ]).values, [ 'a', 'b' ]);

assert.equal({ type: "text" }.type, "text");
assert.equal({ type: "number" }.type, "number");
assert.equal({ type: "boolean" }.type, "boolean");
assert.equal({ type: "date" }.type, "date");
assert.equal({ type: "enum" }.type, "enum");
assert.equal({ type: "object" }.type, "object");
assert.equal({ type: "binary" }.type, "binary");

assert.throws(function () { Property.check({ type: "buffer" }); });
assert.throws(function () { Property.check({ type: "unknown" }); });
